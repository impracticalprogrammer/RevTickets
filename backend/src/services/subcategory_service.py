from src.models.subcategory import SubCategory
from src.models.category import Category
from src.schemas.subcategory import SubCategoryCreate, SubCategoryUpdate, SubCategoryResponse
from typing import List
class SubCategoryService:
    @staticmethod
    async def create_subcategory(subcategory_data: SubCategoryCreate) -> SubCategoryResponse:
        category = await Category.get(subcategory_data.category_id)
        if not category:
            raise ValueError("Invalid category ID")
            
        subcategory = SubCategory(
            name=subcategory_data.name,
            description=subcategory_data.description,
            category=category
        )
        subcategory = await subcategory.insert()
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Handle the category field properly - consistent with other methods
        if category:
            subcategory_dict["category"] = {
                "id": str(category.id),
                "name": category.name,
                "description": category.description
            }
        
        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def get_all_subcategories() -> List[SubCategoryResponse]:
        subcategories = await SubCategory.find_all().to_list()
        result = []
        for subcategory in subcategories:
            subcategory_dict = subcategory.model_dump()
            subcategory_dict["id"] = str(subcategory.id)
            
            # Get the category by ID instead of using fetch_link
            if subcategory.category and subcategory.category.ref:
                category = await Category.get(subcategory.category.ref.id)
                if category:
                    subcategory_dict["category"] = {
                        "id": str(category.id),
                        "name": category.name,
                        "description": category.description
                    }
            
            result.append(SubCategoryResponse(**subcategory_dict))
        return result

    @staticmethod
    async def get_subcategory(subcategory_id: str) -> SubCategoryResponse:
        subcategory = await SubCategory.get(subcategory_id)
        if not subcategory:
            return None 
        
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Get the category by ID instead of using fetch_link
        if subcategory.category and subcategory.category.ref:
            category = await Category.get(subcategory.category.ref.id)
            if category:
                subcategory_dict["category"] = {
                    "id": str(category.id),
                    "name": category.name,
                    "description": category.description
                }
        
        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def update_subcategory(subcategory_id: str, subcategory_data: SubCategoryUpdate) -> SubCategoryResponse:
        from src.models.ticket import Ticket
        from datetime import datetime, timezone
        
        subcategory = await SubCategory.get(subcategory_id)
        if not subcategory:
            return None

        # Check if name is being updated
        old_name = subcategory.name
        subcategory.name = subcategory_data.name or subcategory.name
        subcategory.description = subcategory_data.description or subcategory.description
        name_changed = subcategory_data.name is not None and subcategory_data.name != old_name
        
        if subcategory_data.category_id:
            category = await Category.get(subcategory_data.category_id)
            if not category:
                raise ValueError("Invalid category ID")
            subcategory.category = category

        subcategory = await subcategory.save()
        
        # If subcategory name changed, update updated_at timestamp on all tickets with this subcategory
        if name_changed:
            try:
                from beanie import PydanticObjectId
                object_id = PydanticObjectId(subcategory_id)
                # Find all tickets that reference this subcategory using the field name (not alias)
                # Beanie stores Links using the field name 'sub_category_id', not the alias 'subCategoryId'
                tickets = await Ticket.find({"sub_category_id.$id": object_id}).to_list()
                # If that doesn't work, try alternative query methods
                if len(tickets) == 0:
                    # Try fetching all tickets and filtering manually
                    all_tickets = await Ticket.find_all().to_list()
                    tickets = [
                        t for t in all_tickets 
                        if t.sub_category_id and hasattr(t.sub_category_id, 'ref') and t.sub_category_id.ref and str(t.sub_category_id.ref.id) == subcategory_id
                    ]
                # Update updated_at timestamp to ensure tickets reflect the new subcategory name
                for ticket in tickets:
                    ticket.updated_at = datetime.now(timezone.utc)
                    await ticket.save()
                print(f"Updated {len(tickets)} tickets to reflect subcategory name change")
            except Exception as e:
                print(f"Warning: Failed to update tickets for subcategory {subcategory_id}: {e}")
                import traceback
                traceback.print_exc()
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Handle the category field properly
        if subcategory.category:
            # Check if it's a Link object (has .ref) or a full Category object
            if hasattr(subcategory.category, 'ref') and subcategory.category.ref:
                # It's a Link object, need to fetch
                category = await Category.get(subcategory.category.ref.id)
                if category:
                    subcategory_dict["category"] = {
                        "id": str(category.id),
                        "name": category.name,
                        "description": category.description
                    }
            else:
                # It's already a full Category object
                subcategory_dict["category"] = {
                    "id": str(subcategory.category.id),
                    "name": subcategory.category.name,
                    "description": subcategory.category.description
                }

        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def delete_subcategory(subcategory_id: str):
        subcategory = await SubCategory.get(subcategory_id)
        if subcategory:
            await subcategory.delete()

