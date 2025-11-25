from src.models.ticket import Ticket
from src.models.tag import Tag
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.user import User
from src.models.agent_info import AgentInfo
from src.models.enums import TicketStatus
from src.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, UserInfo, TagData
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from beanie import PydanticObjectId, Link
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException


class TicketService:
    @staticmethod
    async def _build_ticket_response(ticket: Ticket) -> TicketResponse:
        # Always fetch linked objects fresh from the database to ensure we have the latest data
        # This is critical for category/subcategory names that may have been updated
        
        # Get category ID and fetch fresh from database
        if ticket.category_id:
            if hasattr(ticket.category_id, 'ref') and ticket.category_id.ref:
                # It's a Link, get the ID from ref
                category_id = ticket.category_id.ref.id
            elif hasattr(ticket.category_id, 'id'):
                # It's an object, get the ID directly
                category_id = ticket.category_id.id
            else:
                category_id = None
            
            category = await Category.get(category_id) if category_id else None
            if category:
                print(f"[TicketService] Fetched category for ticket {ticket.id}: '{category.name}' (ID: {category.id})")
        else:
            category = None
        
        # Get subcategory ID and fetch fresh from database
        if ticket.sub_category_id:
            if hasattr(ticket.sub_category_id, 'ref') and ticket.sub_category_id.ref:
                subcategory_id = ticket.sub_category_id.ref.id
            elif hasattr(ticket.sub_category_id, 'id'):
                subcategory_id = ticket.sub_category_id.id
            else:
                subcategory_id = None
            
            subcategory = await SubCategory.get(subcategory_id) if subcategory_id else None
        else:
            subcategory = None
        
        # For user and agent, we can use the existing logic since those don't get updated as frequently
        if hasattr(ticket.user_id, 'fetch'):
            user = await ticket.user_id.fetch() if ticket.user_id else None
        else:
            user = ticket.user_id
            
        if hasattr(ticket.agent_id, 'fetch') and ticket.agent_id:
            agent = await ticket.agent_id.fetch()
        else:
            agent = ticket.agent_id

        if category:
            category.id = str(category.id)
        if subcategory:
            subcategory.id = str(subcategory.id)
        if user:
            user.id = str(user.id)
        if agent:
            agent.id = str(agent.id)
        
        # Handle category response
        category = CategoryResponse(**category.model_dump()) if category else None
        
        # Handle subcategory response with proper category Link handling
        if subcategory:
            subcategory_dict = subcategory.model_dump()
            subcategory_dict["id"] = str(subcategory.id)
            
            # Handle the category in subcategory - might be Link or actual object
            if subcategory.category:
                if hasattr(subcategory.category, 'ref') and subcategory.category.ref:
                    # It's a Link object, need to fetch
                    subcategory_category = await Category.get(subcategory.category.ref.id)
                    if subcategory_category:
                        subcategory_dict["category"] = {
                            "id": str(subcategory_category.id),
                            "name": subcategory_category.name,
                            "description": subcategory_category.description
                        }
                else:
                    # It's already a Category object
                    subcategory_dict["category"] = {
                        "id": str(subcategory.category.id),
                        "name": subcategory.category.name,
                        "description": subcategory.category.description
                    }
            
            subcategory = SubCategoryResponse(**subcategory_dict)
        else:
            subcategory = None
        user = UserInfo(id=str(user.id), email=user.email, name=(user.first_name + " " + user.last_name)) if user else None
        agent = UserInfo(id=str(agent.id), email=agent.email, name=(agent.first_name + " " + agent.last_name)) if agent else None
        

        # Convert tag format from {'key': 'value'} to TagData objects
        tag_data = []
        if ticket.tag_ids:
            for tag_dict in ticket.tag_ids:
                for key, value in tag_dict.items():
                    tag_data.append({"key": key, "value": value})

        return TicketResponse(
            id=str(ticket.id),
            status=ticket.status,
            user_info=user,
            agent_info=agent,
            title=ticket.title,
            description=ticket.description,
            content=ticket.content,
            priority=ticket.priority,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            closed_at=ticket.closed_at,
            category=category,
            sub_category=subcategory,
            tag_ids=tag_data,
            )



    @staticmethod
    async def create_ticket(data: TicketCreate, current_user: User) -> TicketResponse:
        # Convert string IDs to PydanticObjectId
        try:
            category_obj_id = PydanticObjectId(data.category_id)
            subcategory_obj_id = PydanticObjectId(data.sub_category_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ID format: {str(e)}")
        
        # Get category and subcategory
        category = await Category.get(category_obj_id)
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        subcategory = await SubCategory.get(subcategory_obj_id)
        if not subcategory:
            raise HTTPException(status_code=400, detail="Invalid subcategory")
        
        # Handle tags if provided - tags are stored as key-value pairs directly in the ticket
        tag_ids = data.tag_ids if data.tag_ids else []

        # Create ticket with 'new' status and no agent assignment initially
        # Beanie should automatically convert objects to Links based on model definition
        ticket = Ticket(
            category_id=category,
            sub_category_id=subcategory,
            user_id=current_user,
            agent_id=None,
            title=data.title,
            description=data.description,
            content=data.content,
            status=TicketStatus.new,
            priority=data.priority,
            tag_ids=tag_ids
        )
        
        ticket = await ticket.insert()
        
        # Try to auto-assign the ticket to an appropriate agent
        try:
            print(f"Attempting auto-assignment for ticket {ticket.id} in category {category.name}")
            from src.models.agent_info import AgentInfo
            
            # Find agents with matching category skills first
            qualified_agents = await AgentInfo.find({"category.$id": category.id}).to_list()
            print(f"Found {len(qualified_agents)} qualified agents for category {category.name}")
            
            assignment_type = "qualified"
            
            # If no qualified agents, get all agents as fallback
            if not qualified_agents:
                print(f"No skilled agents found for {category.name}, looking for any available agent")
                all_agent_infos = await AgentInfo.find_all().to_list()
                qualified_agents = all_agent_infos
                assignment_type = "fallback"
                print(f"Found {len(qualified_agents)} total agents as fallback")
            
            if qualified_agents:
                # Simple round-robin assignment: find agent with least active tickets
                best_agent = None
                min_active_tickets = float('inf')
                
                for agent_info in qualified_agents:
                    agent = await agent_info.user.fetch()
                    # Count active tickets for this agent using Python filtering
                    all_tickets = await Ticket.find_all().to_list()
                    active_tickets = 0
                    for ticket in all_tickets:
                        if (ticket.agent_id and hasattr(ticket.agent_id, 'id') and 
                            ticket.agent_id.id == agent.id and 
                            ticket.status in [TicketStatus.new, TicketStatus.in_progress, TicketStatus.waiting_for_customer]):
                            active_tickets += 1
                    print(f"Agent {agent.email} has {active_tickets} active tickets")
                    
                    if active_tickets < min_active_tickets:
                        min_active_tickets = active_tickets
                        best_agent = agent
                
                if best_agent:
                    print(f"Auto-assigning ticket {ticket.id} to {assignment_type} agent {best_agent.email}")
                    ticket.agent_id = best_agent
                    ticket.status = TicketStatus.in_progress
                    await ticket.save()
                    print(f"Successfully auto-assigned ticket {ticket.id} to {best_agent.email} ({assignment_type})")
                else:
                    print(f"No available agents found for auto-assignment")
            else:
                print(f"No agents found in the system at all")
        except Exception as e:
            print(f"Auto-assignment failed for ticket {ticket.id}: {e}")
            # Don't fail the ticket creation if auto-assignment fails
            pass
        
        return await TicketService._build_ticket_response(ticket)
    @staticmethod
    async def get_all_tickets(current_user: User, filters: dict = None) -> List[TicketResponse]:
        """Get tickets based on user role and permissions"""
        print(f"TicketService.get_all_tickets - User: {current_user.email}, Role: {current_user.role}")
        
        if current_user.role == "user":
            # Since Beanie is storing full User objects, get all tickets and filter in Python
            print(f"Fetching all tickets and filtering for user: {current_user.email}")
            all_tickets = await Ticket.find_all().to_list()
            
            # Filter tickets where user_id matches current_user.id
            tickets = []
            for ticket in all_tickets:
                if hasattr(ticket.user_id, 'id') and ticket.user_id.id == current_user.id:
                    tickets.append(ticket)
            
            print(f"Found {len(tickets)} tickets for user {current_user.email}")
        elif current_user.role == "agent":
            # Since Beanie is storing full objects, get all tickets and filter in Python
            print(f"Fetching all tickets and filtering for agent: {current_user.email}")
            all_tickets = await Ticket.find_all().to_list()
            
            # Get agent info to check category skills
            print(f"Fetching agent info for user ID: {current_user.id}")
            agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
            
            tickets = []
            if agent_info:
                print(f"Found agent info for {current_user.email}")
                for ticket in all_tickets:
                    # Check if ticket is assigned to this agent
                    if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                        tickets.append(ticket)
                        continue
                    
                    # Check if ticket is unassigned and in agent's category
                    if not ticket.agent_id and agent_info.category:
                        # Handle both Link reference and full Category object
                        agent_category_id = None
                        if hasattr(agent_info.category, 'ref') and agent_info.category.ref:
                            agent_category_id = agent_info.category.ref.id
                        elif hasattr(agent_info.category, 'id'):
                            agent_category_id = agent_info.category.id
                        
                        if agent_category_id:
                            ticket_category_id = None
                            if hasattr(ticket.category_id, 'id'):
                                ticket_category_id = ticket.category_id.id
                            elif hasattr(ticket.category_id, 'ref') and ticket.category_id.ref:
                                ticket_category_id = ticket.category_id.ref.id
                            
                            if ticket_category_id == agent_category_id:
                                tickets.append(ticket)
                
                print(f"Found {len(tickets)} tickets for agent {current_user.email} (assigned + queue)")
            else:
                print(f"No agent info found for {current_user.email}")
                # Agent with no AgentInfo can only see tickets directly assigned to them
                for ticket in all_tickets:
                    if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                        tickets.append(ticket)
                print(f"Found {len(tickets)} assigned tickets for agent {current_user.email}")
        else:
            # Unknown role
            tickets = []
        
        # Apply filters if provided
        if filters:
            print(f"Applying filters: {filters}")
            filtered_tickets = []
            for ticket in tickets:
                include_ticket = True
                
                # Apply status filter
                if 'status' in filters and ticket.status != filters['status']:
                    include_ticket = False
                
                # Apply priority filter  
                if 'priority' in filters and ticket.priority != filters['priority']:
                    include_ticket = False
                
                
                if include_ticket:
                    filtered_tickets.append(ticket)
            
            tickets = filtered_tickets
            print(f"After filtering: {len(tickets)} tickets remain")
        
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod
    async def get_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            return await TicketService._build_ticket_response(ticket)
        return None

    @staticmethod
    async def update_ticket(ticket_id: PydanticObjectId, data: TicketUpdate) -> Optional[TicketResponse]:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            ticket.updated_at = datetime.now(timezone.utc)
            updated_ticket = await ticket.set(data.dict(exclude_unset=True))
            updated_ticket.id = str(updated_ticket.id)
            return await TicketService._build_ticket_response(updated_ticket)
        return None

    @staticmethod
    async def delete_ticket(ticket_id: PydanticObjectId) -> bool:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            await ticket.delete()
            return True
        return False

    @staticmethod
    async def get_tickets_by_user(current_user: User) -> List[TicketResponse]:
        # Get all tickets and filter in Python
        all_tickets = await Ticket.find_all().to_list()
        tickets = []
        
        if current_user.role == "user":
            for ticket in all_tickets:
                if hasattr(ticket.user_id, 'id') and ticket.user_id.id == current_user.id:
                    tickets.append(ticket)
        elif current_user.role == "agent":
            for ticket in all_tickets:
                if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                    tickets.append(ticket)
        else:
            return []  # or raise HTTPException(status_code=403, detail="Role not supported")
    
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod
    async def assign_ticket(ticket_id: PydanticObjectId, agent_id: str) -> Optional[TicketResponse]:
        """Assign a ticket to a specific agent"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        agent = await User.get(agent_id)
        if not agent or agent.role != "agent":
            raise HTTPException(status_code=400, detail="Invalid agent")
        
        # Update ticket
        ticket.agent_id = agent
        ticket.status = TicketStatus.in_progress
        ticket.updated_at = datetime.now(timezone.utc)
        
        await ticket.save()
        return await TicketService._build_ticket_response(ticket)

    @staticmethod
    async def auto_assign_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        """Automatically assign ticket to an agent based on category skills"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if not ticket.category_id:
            raise HTTPException(status_code=400, detail="Ticket must have a category for auto-assignment")
        
        # Find agents with matching category skills
        category = await ticket.category_id.fetch()
        qualified_agents = await AgentInfo.find({"category.$id": category.id}).to_list()
        
        # If no qualified agents, get all agents as fallback
        if not qualified_agents:
            print(f"No skilled agents found for {category.name}, looking for any available agent")
            all_agent_infos = await AgentInfo.find_all().to_list()
            qualified_agents = all_agent_infos
            
        if not qualified_agents:
            raise HTTPException(status_code=400, detail="No agents found in the system")
        
        # Simple round-robin assignment: find agent with least active tickets
        best_agent = None
        min_active_tickets = float('inf')
        
        for agent_info in qualified_agents:
            agent = await agent_info.user.fetch()
            # Count active tickets for this agent using Python filtering
            all_tickets = await Ticket.find_all().to_list()
            active_tickets = 0
            for ticket in all_tickets:
                if (ticket.agent_id and hasattr(ticket.agent_id, 'id') and 
                    ticket.agent_id.id == agent.id and 
                    ticket.status in [TicketStatus.new, TicketStatus.in_progress, TicketStatus.waiting_for_customer]):
                    active_tickets += 1
            
            if active_tickets < min_active_tickets:
                min_active_tickets = active_tickets
                best_agent = agent
        
        if best_agent:
            return await TicketService.assign_ticket(ticket_id, str(best_agent.id))
        else:
            raise HTTPException(status_code=400, detail="No available agents found")

    @staticmethod
    async def update_ticket_status(ticket_id: PydanticObjectId, new_status: TicketStatus) -> Optional[TicketResponse]:
        """Update ticket status with proper state management"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Validate state transitions
        valid_transitions = {
            TicketStatus.new: [TicketStatus.in_progress, TicketStatus.waiting_for_agent],
            TicketStatus.in_progress: [TicketStatus.waiting_for_customer, TicketStatus.resolved, TicketStatus.closed],
            TicketStatus.waiting_for_customer: [TicketStatus.in_progress, TicketStatus.closed],
            TicketStatus.waiting_for_agent: [TicketStatus.in_progress],
            TicketStatus.resolved: [TicketStatus.closed, TicketStatus.in_progress],  # Allow reopening from resolved
            TicketStatus.closed: [TicketStatus.in_progress]  # Allow reopening from closed
        }
        
        if new_status not in valid_transitions.get(ticket.status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {ticket.status} to {new_status}"
            )
        
        # Update ticket
        ticket.status = new_status
        ticket.updated_at = datetime.now(timezone.utc)
        
        # Set closedAt timestamp for closed/resolved states
        if new_status in [TicketStatus.closed, TicketStatus.resolved]:
            ticket.closed_at = datetime.now(timezone.utc)
        elif ticket.closed_at:  # Clear closedAt if reopening
            ticket.closed_at = None
        
        await ticket.save()
        return await TicketService._build_ticket_response(ticket)

    @staticmethod
    async def close_ticket(ticket_id: PydanticObjectId, resolution_comment: str = None) -> Optional[TicketResponse]:
        """Close a ticket with optional resolution comment"""
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.closed)

    @staticmethod
    async def resolve_ticket(ticket_id: PydanticObjectId, resolution_comment: str = None) -> Optional[TicketResponse]:
        """Mark a ticket as resolved with optional resolution comment"""
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.resolved)

    @staticmethod
    def _calculate_business_days(start_date: datetime, end_date: datetime) -> int:
        """Calculate business days between two dates (excluding weekends)"""
        business_days = 0
        current_date = start_date.date()
        end_date = end_date.date()
        
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Monday = 0, Sunday = 6
                business_days += 1
            current_date += timedelta(days=1)
        
        return business_days

    @staticmethod
    async def can_reopen_ticket(ticket_id: PydanticObjectId) -> bool:
        """Check if a ticket can be reopened (within 10 business days)"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            return False
        
        if ticket.status not in [TicketStatus.closed, TicketStatus.resolved]:
            return False
        
        if not ticket.closed_at:
            return False
        
        now = datetime.now(timezone.utc)
        business_days = TicketService._calculate_business_days(ticket.closed_at, now)
        
        return business_days <= 10

    @staticmethod
    async def reopen_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        """Reopen a closed/resolved ticket if within 10 business days"""
        if not await TicketService.can_reopen_ticket(ticket_id):
            raise HTTPException(
                status_code=400, 
                detail="Ticket cannot be reopened. Either it's not closed/resolved or more than 10 business days have passed."
            )
        
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.in_progress)

    @staticmethod
    async def get_queue_tickets(current_user: User) -> List[TicketResponse]:
        """Get unassigned tickets in agent's skill categories (queue view)"""
        if current_user.role != "agent":
            raise HTTPException(status_code=403, detail="Only agents can access the queue")
        
        agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
        if not agent_info or not agent_info.category:
            return []  # Agent has no skills, no queue access
        
        # Get agent's category ID
        agent_category_id = None
        if hasattr(agent_info.category, 'ref') and agent_info.category.ref:
            agent_category_id = agent_info.category.ref.id
        elif hasattr(agent_info.category, 'id'):
            agent_category_id = agent_info.category.id
            
        if not agent_category_id:
            return []
        
        # Get all tickets and filter in Python
        all_tickets = await Ticket.find_all().to_list()
        tickets = []
        
        for ticket in all_tickets:
            # Check if ticket is unassigned and in correct status
            if ticket.agent_id is None and ticket.status in [TicketStatus.new, TicketStatus.waiting_for_agent]:
                # Check if ticket is in agent's category
                ticket_category_id = None
                if hasattr(ticket.category_id, 'id'):
                    ticket_category_id = ticket.category_id.id
                elif hasattr(ticket.category_id, 'ref') and ticket.category_id.ref:
                    ticket_category_id = ticket.category_id.ref.id
                
                if ticket_category_id == agent_category_id:
                    tickets.append(ticket)
        
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod 
    async def get_my_assigned_tickets(current_user: User) -> List[TicketResponse]:
        """Get tickets assigned to the current agent"""
        if current_user.role != "agent":
            raise HTTPException(status_code=403, detail="Only agents can access assigned tickets")
        
        # Get all tickets and filter in Python
        all_tickets = await Ticket.find_all().to_list()
        tickets = []
        
        for ticket in all_tickets:
            if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                tickets.append(ticket)
        
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod
    async def can_access_ticket(ticket_id: PydanticObjectId, current_user: User) -> bool:
        """Check if user can access a specific ticket"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            return False
        
        if current_user.role == "user":
            # Users can only access their own tickets
            if hasattr(ticket.user_id, 'id'):
                return str(ticket.user_id.id) == str(current_user.id)
            elif hasattr(ticket.user_id, 'ref') and ticket.user_id.ref:
                return str(ticket.user_id.ref.id) == str(current_user.id)
            return False
        elif current_user.role == "agent":
            # Agents can access tickets assigned to them OR unassigned tickets in their category
            
            # Check if assigned to this agent
            if ticket.agent_id:
                agent_matches = False
                if hasattr(ticket.agent_id, 'id'):
                    agent_matches = str(ticket.agent_id.id) == str(current_user.id)
                elif hasattr(ticket.agent_id, 'ref') and ticket.agent_id.ref:
                    agent_matches = str(ticket.agent_id.ref.id) == str(current_user.id)
                
                if agent_matches:
                    return True
            
            # Check if unassigned ticket in agent's category
            if not ticket.agent_id:
                agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
                if agent_info and agent_info.category:
                    # Get agent's category ID
                    agent_category_id = None
                    if hasattr(agent_info.category, 'ref') and agent_info.category.ref:
                        agent_category_id = agent_info.category.ref.id
                    elif hasattr(agent_info.category, 'id'):
                        agent_category_id = agent_info.category.id
                    
                    # Get ticket's category ID
                    ticket_category_id = None
                    if hasattr(ticket.category_id, 'id'):
                        ticket_category_id = ticket.category_id.id
                    elif hasattr(ticket.category_id, 'ref') and ticket.category_id.ref:
                        ticket_category_id = ticket.category_id.ref.id
                    
                    if agent_category_id and ticket_category_id and str(ticket_category_id) == str(agent_category_id):
                        return True
        
        return False

    @staticmethod
    async def get_ticket_stats(current_user: User) -> dict:
        """Get ticket statistics based on user role"""
        # Get all tickets and filter in Python
        all_tickets = await Ticket.find_all().to_list()
        tickets = []
        
        if current_user.role == "user":
            # Users only see stats for their own tickets
            for ticket in all_tickets:
                if hasattr(ticket.user_id, 'id') and ticket.user_id.id == current_user.id:
                    tickets.append(ticket)
        elif current_user.role == "agent":
            # Agents see stats for tickets they can access (assigned + queue)
            agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
            
            if agent_info:
                agent_category_id = None
                if agent_info.category:
                    if hasattr(agent_info.category, 'ref') and agent_info.category.ref:
                        agent_category_id = agent_info.category.ref.id
                    elif hasattr(agent_info.category, 'id'):
                        agent_category_id = agent_info.category.id
                
                for ticket in all_tickets:
                    # Check if ticket is assigned to this agent
                    if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                        tickets.append(ticket)
                        continue
                    
                    # Check if ticket is unassigned and in agent's category
                    if not ticket.agent_id and agent_category_id:
                        ticket_category_id = None
                        if hasattr(ticket.category_id, 'id'):
                            ticket_category_id = ticket.category_id.id
                        elif hasattr(ticket.category_id, 'ref') and ticket.category_id.ref:
                            ticket_category_id = ticket.category_id.ref.id
                        
                        if ticket_category_id == agent_category_id:
                            tickets.append(ticket)
            else:
                # Agent with no AgentInfo - only assigned tickets
                for ticket in all_tickets:
                    if ticket.agent_id and hasattr(ticket.agent_id, 'id') and ticket.agent_id.id == current_user.id:
                        tickets.append(ticket)
        else:
            tickets = []

        # Count by status
        stats = {
            "total": len(tickets),
            "new": 0,
            "in_progress": 0,
            "waiting_for_customer": 0,
            "waiting_for_agent": 0,
            "resolved": 0,
            "closed": 0,
            "by_priority": {
                "low": 0,
                "medium": 0,
                "high": 0,
                "critical": 0
            },
        }

        for ticket in tickets:
            # Count by status
            if ticket.status == TicketStatus.new:
                stats["new"] += 1
            elif ticket.status == TicketStatus.in_progress:
                stats["in_progress"] += 1
            elif ticket.status == TicketStatus.waiting_for_customer:
                stats["waiting_for_customer"] += 1
            elif ticket.status == TicketStatus.waiting_for_agent:
                stats["waiting_for_agent"] += 1
            elif ticket.status == TicketStatus.resolved:
                stats["resolved"] += 1
            elif ticket.status == TicketStatus.closed:
                stats["closed"] += 1

            # Count by priority
            stats["by_priority"][ticket.priority.value] += 1
            

        return stats

