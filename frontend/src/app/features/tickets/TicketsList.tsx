'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Pagination } from 'flowbite-react';
import { Plus, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ticketsApi } from '../../../lib/api';
import { formatFullDateTime } from '../../../lib/utils';
import { LoadingSpinner } from '../../shared/components';
import type { Ticket } from '../../shared/types';
import { getRichTextDisplay } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';

type SortField = 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export function TicketsList() {
  const router = useRouter();
  const { user } = useAuth();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (priorityFilter !== 'all') {  
        params.priority = priorityFilter;
      }
      
      const data = await ticketsApi.getAll(params);
      setAllTickets(data);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...allTickets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        getRichTextDisplay(ticket.content).toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField as keyof typeof a] as string | number;
      let bValue: string | number = b[sortField as keyof typeof b] as string | number;

      // Handle date fields
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Handle priority with importance order
      else if (sortField === 'priority') {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aValue = priorityOrder[aValue as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[bValue as keyof typeof priorityOrder] || 0;
      }
      // Handle status with workflow order
      else if (sortField === 'status') {
        const statusOrder = { 
          'new': 1, 
          'in_progress': 2, 
          'waiting_for_customer': 3, 
          'waiting_for_agent': 4, 
          'resolved': 5, 
          'closed': 6 
        };
        aValue = statusOrder[aValue as keyof typeof statusOrder] || 0;
        bValue = statusOrder[bValue as keyof typeof statusOrder] || 0;
      }
      // Handle string fields
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = filtered.slice(startIndex, endIndex);

    setTickets(paginatedTickets);
  }, [allTickets, searchQuery, sortField, sortDirection, currentPage, itemsPerPage]);

  // Effects
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, fetchTickets]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [allTickets, searchQuery, sortField, sortDirection, currentPage, applyFiltersAndSorting]);

  // Listen for category updates and refetch tickets
  useEffect(() => {
    const handleCategoryUpdate = () => {
      console.log('[TicketsList] Category updated, refetching tickets...');
      fetchTickets();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('categoryUpdated', handleCategoryUpdate);
      return () => {
        window.removeEventListener('categoryUpdated', handleCategoryUpdate);
      };
    }
  }, [fetchTickets]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    applyFiltersAndSorting();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading tickets..." />;
  }

  return (
    <div className="space-y-6">

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <Button
            onClick={handleSearch}
            className="bg-orange-600 px-4 hover:bg-orange-700 focus:ring-orange-500 text-white transition-colors"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_agent">Waiting for Agent</option>
            <option value="waiting_for_customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {user?.role !== 'agent' && (
            <Link href="/tickets/create">
              <Button className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-sm">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first ticket to get started'}
              </p>
            </div>
            {!searchQuery && user?.role !== 'agent' && (
              <Link href="/tickets/create">
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <span>Ticket</span>
                      {getSortIcon('title')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Status</span>
                      {getSortIcon('status')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>Priority</TableHeadCell>
                  <TableHeadCell>
                    {user?.role === 'agent' ? 'Created By' : 'Assigned Agent'}
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Created</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('updatedAt')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Updated</span>
                      {getSortIcon('updatedAt')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer group"
                    onClick={() => handleTicketClick(ticket.id)}
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white py-4">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {ticket.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          #{ticket.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          ticket.status === 'new' ? 'bg-blue-500' :
                          ticket.status === 'in_progress' ? 'bg-yellow-500' :
                          ticket.status === 'waiting_for_customer' ? 'bg-orange-500' :
                          ticket.status === 'waiting_for_agent' ? 'bg-purple-500' :
                          ticket.status === 'resolved' ? 'bg-green-500' :
                          ticket.status === 'closed' ? 'bg-gray-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium whitespace-nowrap ${
                          ticket.status === 'new' ? 'text-blue-700 dark:text-blue-300' :
                          ticket.status === 'in_progress' ? 'text-yellow-700 dark:text-yellow-300' :
                          ticket.status === 'waiting_for_customer' ? 'text-orange-700 dark:text-orange-300' :
                          ticket.status === 'waiting_for_agent' ? 'text-purple-700 dark:text-purple-300' :
                          ticket.status === 'resolved' ? 'text-green-700 dark:text-green-300' :
                          ticket.status === 'closed' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600'
                        }`}>
                          {ticket.status === 'new' ? 'New' :
                           ticket.status === 'in_progress' ? 'In Progress' :
                           ticket.status === 'waiting_for_customer' ? 'Waiting for Customer' :
                           ticket.status === 'waiting_for_agent' ? 'Waiting for Agent' :
                           ticket.status === 'resolved' ? 'Resolved' :
                           ticket.status === 'closed' ? 'Closed' : ticket.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          ticket.priority === 'critical' ? 'bg-red-500' :
                          ticket.priority === 'high' ? 'bg-orange-500' :
                          ticket.priority === 'medium' ? 'bg-yellow-500' :
                          ticket.priority === 'low' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          ticket.priority === 'critical' ? 'text-red-700 dark:text-red-300' :
                          ticket.priority === 'high' ? 'text-orange-700 dark:text-orange-300' :
                          ticket.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
                          ticket.priority === 'low' ? 'text-green-700 dark:text-green-300' : 'text-gray-600'
                        }`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {user?.role === 'agent' ? (
                        // Agent view: show who created the ticket
                        ticket.userInfo ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {ticket.userInfo.name ? 
                                    ticket.userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                                    ticket.userInfo.email[0].toUpperCase()
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {ticket.userInfo.name || ticket.userInfo.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                User
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unknown User</span>
                        )
                      ) : (
                        // User view: show assigned agent
                        ticket.agentInfo ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {ticket.agentInfo.name ? 
                                    ticket.agentInfo.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                                    ticket.agentInfo.email[0].toUpperCase()
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {ticket.agentInfo.name || ticket.agentInfo.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Agent
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400 py-4">
                      <div className="whitespace-nowrap">
                        {formatFullDateTime(ticket.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400 py-4">
                      <div className="whitespace-nowrap">
                        {formatFullDateTime(ticket.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Button
                          size="xs"
                          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(ticket.id);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination and Results Summary */}
      {allTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {(() => {
              let filtered = [...allTickets];
              
              // Apply search filter for count
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(ticket => 
                  ticket.title.toLowerCase().includes(query) ||
                  ticket.description.toLowerCase().includes(query) ||
                  getRichTextDisplay(ticket.content).toLowerCase().includes(query)
                );
              }
              
              const totalFiltered = filtered.length;
              const startIndex = (currentPage - 1) * itemsPerPage + 1;
              const endIndex = Math.min(currentPage * itemsPerPage, totalFiltered);
              
              if (totalFiltered === 0) {
                return 'No tickets found';
              }
              
              return (
                <>
                  Showing {startIndex}-{endIndex} of {totalFiltered} ticket{totalFiltered !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {(statusFilter !== 'all' || priorityFilter !== 'all') && ' with applied filters'}
                </>
              );
            })()}
          </div>
          
          {(() => {
            let filtered = [...allTickets];
            
            // Apply search filter for pagination
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              filtered = filtered.filter(ticket => 
                ticket.title.toLowerCase().includes(query) ||
                ticket.description.toLowerCase().includes(query) ||
                getRichTextDisplay(ticket.content).toLowerCase().includes(query)
              );
            }
            
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            
            return totalPages > 1 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showIcons
              />
            ) : null;
          })()}
        </div>
      )}

    </div>
  );
}