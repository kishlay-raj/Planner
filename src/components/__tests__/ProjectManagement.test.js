import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectManagement from '../ProjectManagement';
import { useFirestore } from '../../hooks/useFirestore';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock useFirestore hook
jest.mock('../../hooks/useFirestore');

const mockTheme = createTheme();

describe('ProjectManagement Component', () => {
    let mockProjects;
    let mockSetProjects;

    beforeEach(() => {
        jest.clearAllMocks();
        mockProjects = [
            {
                id: '1',
                name: 'Priority Project A',
                description: 'A priority project desc',
                priority: true,
                archived: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Normal Project B',
                description: 'A normal project desc',
                priority: false,
                archived: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Archived Project C',
                description: 'An archived project desc',
                priority: false,
                archived: true,
                createdAt: new Date().toISOString()
            }
        ];
        mockSetProjects = jest.fn();

        useFirestore.mockImplementation((key, defaultValue) => {
            if (key === 'projects') {
                return [mockProjects, mockSetProjects, false, false];
            }
            return [defaultValue, jest.fn(), false, false];
        });
    });

    const renderPM = () => {
        return render(
            <ThemeProvider theme={mockTheme}>
                <ProjectManagement />
            </ThemeProvider>
        );
    };

    it('renders all sections and projects correctly', () => {
        renderPM();

        expect(screen.getByText('Project Management')).toBeInTheDocument();
        expect(screen.getByText('Priority Projects (1)')).toBeInTheDocument();
        expect(screen.getByText('Normal Projects (1)')).toBeInTheDocument();
        expect(screen.getByText('Archived Projects (1)')).toBeInTheDocument();

        expect(screen.getByText('Priority Project A')).toBeInTheDocument();
        expect(screen.getByText('Normal Project B')).toBeInTheDocument();
        expect(screen.getByText('Archived Project C')).toBeInTheDocument();
    });

    it('toggles priority of a project', () => {
        renderPM();

        // Get Star toggle buttons
        const starButtons = screen.getAllByRole('button', { name: /toggle priority/i });
        // The first star button is on Priority Project A, clicking it should toggle its priority
        fireEvent.click(starButtons[0]);

        expect(mockSetProjects).toHaveBeenCalled();
        // It updates projects via functional update or direct array update
        const updater = mockSetProjects.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockProjects) : updater;
        
        // Find Project A and verify priority was inverted (false)
        const projA = updated.find(p => p.id === '1');
        expect(projA.priority).toBe(false);
    });

    it('toggles archive status of a project', () => {
        renderPM();

        // Click Archive on Normal Project B
        const archiveButtons = screen.getAllByRole('button', { name: /archive project/i });
        fireEvent.click(archiveButtons[0]); // First archive button is for Project A, 2nd is Project B

        expect(mockSetProjects).toHaveBeenCalled();
        const updater = mockSetProjects.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockProjects) : updater;

        // Project A archived state should be inverted
        const projA = updated.find(p => p.id === '1');
        expect(projA.archived).toBe(true);
    });

    it('opens project details modal on card click', () => {
        renderPM();

        // Click on Priority Project A card content
        const projectCard = screen.getByText('Priority Project A');
        fireEvent.click(projectCard);

        // Details modal should open and display description
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Priority Project A')).toBeInTheDocument();
        expect(within(dialog).getByText('A priority project desc')).toBeInTheDocument();
        expect(within(dialog).getByText('Project details view will be implemented in the future. Add tasks, timelines, and updates here later.')).toBeInTheDocument();
    });

    it('shows delete confirmation dialog and deletes project', () => {
        renderPM();

        // Click Delete button on Priority Project A
        const deleteButtons = screen.getAllByRole('button', { name: /delete project/i });
        fireEvent.click(deleteButtons[0]);

        // Confirmation dialog should appear
        expect(screen.getByText('Delete Project?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete project "Priority Project A"? All project settings will be permanently lost. This action cannot be undone.')).toBeInTheDocument();

        // Click Delete Permanently in the dialog
        const confirmDeleteBtn = screen.getByRole('button', { name: /delete permanently/i });
        fireEvent.click(confirmDeleteBtn);

        expect(mockSetProjects).toHaveBeenCalled();
        const updater = mockSetProjects.mock.calls[0][0];
        const updated = typeof updater === 'function' ? updater(mockProjects) : updater;

        // Verify project A (id: '1') is deleted
        expect(updated.find(p => p.id === '1')).toBeUndefined();
    });

    it('allows creating a new project via the form', () => {
        renderPM();

        // Toggle form visibility
        fireEvent.click(screen.getByRole('button', { name: /new project/i }));

        // Fill Name and Description
        const nameInput = screen.getByLabelText(/project name/i);
        const descInput = screen.getByLabelText(/description/i);

        fireEvent.change(nameInput, { target: { value: 'New Test Project' } });
        fireEvent.change(descInput, { target: { value: 'New test description' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /create project/i }));

        expect(mockSetProjects).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'New Test Project',
                    description: 'New test description',
                    priority: false,
                    archived: false
                })
            ])
        );
    });
});
