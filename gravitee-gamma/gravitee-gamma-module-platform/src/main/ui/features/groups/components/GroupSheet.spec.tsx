/*
 * Copyright © 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { GroupSheet } from './GroupSheet';
import { querySheetHeading } from '../../applications/components/test/sheetSpecHelpers';
import type { Group, GroupRole } from '../types/group';

// Radix Switch measures its thumb via ResizeObserver, which jsdom doesn't implement.
beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as typeof ResizeObserver;
});

const API_ROLES: GroupRole[] = [
    { name: 'USER', scope: 'API', default: true },
    { name: 'OWNER', scope: 'API' },
];

const APPLICATION_ROLES: GroupRole[] = [{ name: 'USER', scope: 'APPLICATION', default: true }];

const EXISTING_GROUP: Group = {
    id: 'group-1',
    name: 'Support Team',
    event_rules: [{ event: 'API_CREATE' }],
    roles: { API: 'OWNER', APPLICATION: 'USER' },
    lock_api_role: false,
};

function renderSheet({
    open = true,
    mode,
    group,
    isSaving = false,
    apiRoles = API_ROLES,
    applicationRoles = APPLICATION_ROLES,
}: {
    open?: boolean;
    mode: 'create' | 'edit';
    group?: Group;
    isSaving?: boolean;
    apiRoles?: GroupRole[];
    applicationRoles?: GroupRole[];
}) {
    const onClose = jest.fn();
    const onSubmit = jest.fn();
    render(
        <GroupSheet
            open={open}
            mode={mode}
            group={group}
            apiRoles={apiRoles}
            applicationRoles={applicationRoles}
            rolesLoading={false}
            onClose={onClose}
            onSubmit={onSubmit}
            isSaving={isSaving}
        />,
    );
    return { onClose, onSubmit };
}

describe('GroupSheet', () => {
    describe('visibility', () => {
        it('does not show sheet content when closed', () => {
            renderSheet({ open: false, mode: 'create' });
            expect(querySheetHeading('Create group')).toBeNull();
        });

        it('shows create title when mode is create', () => {
            renderSheet({ mode: 'create' });
            expect(screen.getByRole('heading', { name: 'Create group' })).not.toBeNull();
        });

        it('shows edit title when mode is edit', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            expect(screen.getByRole('heading', { name: 'Edit group' })).not.toBeNull();
        });
    });

    describe('create mode', () => {
        it('renders an empty name field', () => {
            renderSheet({ mode: 'create' });
            expect((screen.getByLabelText(/Name/i) as HTMLInputElement).value).toBe('');
        });

        it('defaults Lock API role on and Default group for new APIs off', () => {
            renderSheet({ mode: 'create' });
            expect(screen.getByLabelText(/Lock API role/i).getAttribute('aria-checked')).toBe('true');
            expect(screen.getByLabelText(/Default group for new APIs/i).getAttribute('aria-checked')).toBe('false');
        });

        it('pre-selects the default role for each scope', () => {
            renderSheet({ mode: 'create' });
            expect(screen.getAllByText('USER').length).toBeGreaterThan(0);
        });

        it('keeps Create disabled until name is filled', () => {
            renderSheet({ mode: 'create' });
            const createBtn = screen.getByRole('button', { name: 'Create group' }) as HTMLButtonElement;
            expect(createBtn.disabled).toBe(true);

            fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'My Group' } });
            expect(createBtn.disabled).toBe(false);
        });

        it('submits trimmed name with default toggles and roles', () => {
            const { onSubmit } = renderSheet({ mode: 'create' });
            fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: '  My Group  ' } });
            fireEvent.click(screen.getByRole('button', { name: 'Create group' }));
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'My Group',
                lockApiRole: true,
                defaultGroupForNewApis: false,
                apiRole: 'USER',
                applicationRole: 'USER',
            });
        });

        it('toggles Default group for new APIs into the submitted payload', () => {
            const { onSubmit } = renderSheet({ mode: 'create' });
            fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'My Group' } });
            fireEvent.click(screen.getByLabelText(/Default group for new APIs/i));
            fireEvent.click(screen.getByRole('button', { name: 'Create group' }));
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ defaultGroupForNewApis: true }));
        });

        it('shows "Creating…" label while saving', () => {
            renderSheet({ mode: 'create', isSaving: true });
            expect(screen.queryByRole('button', { name: 'Creating…' })).not.toBeNull();
        });
    });

    describe('edit mode', () => {
        it('pre-fills name, lock toggle, and roles from the existing group', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            expect((screen.getByLabelText(/Name/i) as HTMLInputElement).value).toBe('Support Team');
            expect(screen.getByLabelText(/Lock API role/i).getAttribute('aria-checked')).toBe('false');
            expect(screen.getByLabelText(/Default group for new APIs/i).getAttribute('aria-checked')).toBe('true');
            expect(screen.getAllByText('OWNER').length).toBeGreaterThan(0);
        });

        it('disables Save when nothing has changed', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
        });

        it('enables Save after changing the name', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Name' } });
            expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false);
        });

        it('enables Save after toggling Lock API role', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            fireEvent.click(screen.getByLabelText(/Lock API role/i));
            expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false);
        });

        it('submits updated values for the existing group', () => {
            const { onSubmit } = renderSheet({ mode: 'edit', group: EXISTING_GROUP });
            fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Updated Name' } });
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Updated Name', apiRole: 'OWNER', applicationRole: 'USER' }),
            );
        });

        it('shows "Saving…" label while saving', () => {
            renderSheet({ mode: 'edit', group: EXISTING_GROUP, isSaving: true });
            expect(screen.queryByRole('button', { name: 'Saving…' })).not.toBeNull();
        });
    });

    describe('cancel', () => {
        it('invokes onClose when Cancel is clicked', () => {
            const { onClose } = renderSheet({ mode: 'create' });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
