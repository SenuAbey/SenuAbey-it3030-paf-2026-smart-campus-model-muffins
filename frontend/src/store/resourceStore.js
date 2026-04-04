import { create } from 'zustand';

const useResourceStore = create((set) => ({
    resources: [],
    selectedResource: null,
    stats: null,
    loading: false,
    error: null,
    filters: {
        search: '',
        type: '',
        status: '',
        location: '',
        minCapacity: null
    },

    setResources: (resources) => set({ resources }),
    setSelectedResource: (resource) => set({ selectedResource: resource }),
    setStats: (stats) => set({ stats }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),
    resetFilters: () => set({
        filters: {
            search: '',
            type: '',
            status: '',
            location: '',
            minCapacity: null
        }
    })
}));

export default useResourceStore;