import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants';
import type { 
  Ticket, 
  CreateTicket, 
  UpdateTicket, 
  TicketAssignment, 
  TicketClosure, 
  TicketStats,
  Comment,
  CreateComment,
  UpdateComment
} from '../../app/shared/types';

export const ticketsApi = {
  async getAll(params?: {
    status?: string;
    priority?: string;
    categoryId?: string;
    subCategoryId?: string;
    userId?: string;
    agentId?: string;
  }): Promise<Ticket[]> {
    // Add cache-busting timestamp to ensure fresh data
    const allParams = { ...params, _t: Date.now().toString() };
    return apiClient.get(API_ENDPOINTS.TICKETS.BASE, { params: allParams });
  },

  async getById(id: string): Promise<Ticket> {
    // Add cache-busting timestamp to ensure fresh data
    return apiClient.get(`${API_ENDPOINTS.TICKETS.BY_ID(id)}?_t=${Date.now()}`);
  },

  async create(ticket: CreateTicket): Promise<Ticket> {
    return apiClient.post(API_ENDPOINTS.TICKETS.BASE, ticket);
  },

  async update(id: string, ticket: UpdateTicket): Promise<Ticket> {
    return apiClient.put(API_ENDPOINTS.TICKETS.BY_ID(id), ticket);
  },

  async assign(id: string, assignment: TicketAssignment): Promise<Partial<Ticket>> {
    return apiClient.patch(API_ENDPOINTS.TICKETS.ASSIGN(id), assignment);
  },

  async close(id: string, closure: TicketClosure): Promise<Partial<Ticket>> {
    return apiClient.patch(API_ENDPOINTS.TICKETS.CLOSE(id), closure);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.TICKETS.BY_ID(id));
  },

  async getStats(): Promise<TicketStats> {
    return apiClient.get(API_ENDPOINTS.TICKETS.STATS);
  },

  async search(params: {
    q: string;
    status?: string;
    priority?: string;
    categoryId?: string;
  }): Promise<Ticket[]> {
    return apiClient.get(API_ENDPOINTS.TICKETS.SEARCH, { params });
  },

  // Agent-specific endpoints
  async getQueue(): Promise<Ticket[]> {
    return apiClient.get('/tickets/queue');
  },

  async getAssigned(): Promise<Ticket[]> {
    return apiClient.get('/tickets/assigned');
  },

  async assignTicket(ticketId: string, agentId: string): Promise<Ticket> {
    return apiClient.post(`/tickets/${ticketId}/assign`, { agent_id: agentId });
  },

  async autoAssignTicket(ticketId: string): Promise<Ticket> {
    return apiClient.post(`/tickets/${ticketId}/auto-assign`);
  },

  async updateStatus(ticketId: string, status: string): Promise<Ticket> {
    return apiClient.patch(`/tickets/${ticketId}/status`, { status });
  },

  async getComments(ticketId: string): Promise<Comment[]> {
    return apiClient.get(API_ENDPOINTS.TICKETS.COMMENTS(ticketId));
  },

  async createComment(ticketId: string, comment: CreateComment): Promise<Comment> {
    return apiClient.post(API_ENDPOINTS.TICKETS.COMMENTS(ticketId), comment);
  },

  async updateComment(id: string, comment: UpdateComment): Promise<Comment> {
    return apiClient.put(API_ENDPOINTS.COMMENTS.BY_ID(id), comment);
  },

  async deleteComment(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.COMMENTS.BY_ID(id));
  },
};