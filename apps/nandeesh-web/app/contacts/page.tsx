'use client';

import { useState, useMemo, useEffect } from 'react';
import { Client, ClientType } from './_types';
import { NewClientModal } from './_components/NewClientModal';
import { ClientTable } from './_components/ClientTable';
import { ClientDrawer } from './_components/ClientDrawer';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AnimatedButton } from '@/components/ui/animated-button';
import { StaggeredCards } from '@/components/anim/StaggeredList';
import { useToast } from '@/components/ui/toast';
import { cloudStorageService } from '@/lib/cloud-storage-service';

export default function ContactsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ClientType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Load contacts from cloud storage
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const cloudContacts = await cloudStorageService.getAllContacts();
        setClients(cloudContacts);
      } catch (error) {
        console.error("Failed to load contacts from cloud:", error);
        setClients([]);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadContacts();
  }, []);

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(client => client.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(lowercaseQuery) ||
        (client.email && client.email.toLowerCase().includes(lowercaseQuery)) ||
        (client.phone && client.phone.toLowerCase().includes(lowercaseQuery)) ||
        (client.contactPerson && client.contactPerson.toLowerCase().includes(lowercaseQuery))
      );
    }

    return filtered;
  }, [clients, typeFilter, searchQuery]);

  const handleAddClient = async (clientData: {
    type: ClientType;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    altPhone?: string;
    address1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    notes?: string;
  }) => {
    try {
      const clientId = await cloudStorageService.addContact(clientData);
      const newClient: Client = {
        id: clientId,
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setClients(prev => [...prev, newClient]);
      toast.success('Client added successfully!');
    } catch (error) {
      console.error("Failed to add contact to cloud:", error);
      // Still add to local state for immediate UI update
      const newClient: Client = {
        id: Date.now().toString(),
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setClients(prev => [...prev, newClient]);
      toast.success('Client added successfully!');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await cloudStorageService.deleteContact(clientId);
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (error) {
      console.error("Failed to delete contact from cloud:", error);
      // Still delete from local state for immediate UI update
      setClients(prev => prev.filter(client => client.id !== clientId));
    }
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
    setIsDrawerOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setViewingClient(null);
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your clients and their information
              </p>
            </div>
            <AnimatedButton
              onClick={handleNewClient}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add new client"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Client
            </AnimatedButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search clients
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ClientType | 'All')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="All">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
                <option value="Government">Government</option>
                <option value="NGO">NGO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          {filteredClients.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No clients found.
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Client Table */}
        <ClientTable
          clients={filteredClients}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onViewClient={handleViewClient}
        />
      </main>

      {/* Modal */}
      <NewClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddClient={handleAddClient}
        editingClient={editingClient}
      />

      {/* Drawer */}
      <ClientDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        client={viewingClient}
      />
    </div>
  );
}