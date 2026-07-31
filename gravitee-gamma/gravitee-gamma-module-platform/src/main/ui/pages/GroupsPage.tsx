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

import { useHasPermission } from '@gravitee/gamma-modules-sdk';
import { Button } from '@gravitee/graphene-core';
import { PlusIcon } from '@gravitee/graphene-core/icons';
import { useEffect, useState } from 'react';

import { GroupDeleteSheet } from '../features/groups/components/GroupDeleteSheet';
import { GroupSheet, type GroupFormValues } from '../features/groups/components/GroupSheet';
import { GroupsTable } from '../features/groups/components/GroupsTable';
import { useCreateGroup, useDeleteGroup, useUpdateGroup } from '../features/groups/hooks/useGroupMutations';
import { useGroupApiRoles, useGroupApplicationRoles } from '../features/groups/hooks/useGroupRoles';
import { useGroupsPaged } from '../features/groups/hooks/useGroups';
import type { Group, UpdateGroupPayload } from '../features/groups/types/group';
import { buildEventRules, buildRolesMap } from '../features/groups/utils/groupPayload';
import {
    ENVIRONMENT_GROUP_CREATE_PERMISSION,
    ENVIRONMENT_GROUP_DELETE_PERMISSION,
    ENVIRONMENT_GROUP_UPDATE_PERMISSION,
} from '../features/groups/utils/groupPermissions';
import { DEFAULT_GROUP_LIST_PAGE_SIZE, GROUP_SEARCH_DEBOUNCE_MS } from '../features/groups/utils/paginationConstants';
import { notify } from '../shared/notify';

type SheetState = { type: 'closed' } | { type: 'create' } | { type: 'edit'; group: Group } | { type: 'delete'; group: Group };

export function GroupsPage() {
    const canCreate = useHasPermission({ anyOf: [ENVIRONMENT_GROUP_CREATE_PERMISSION] });
    const canEdit = useHasPermission({ anyOf: [ENVIRONMENT_GROUP_UPDATE_PERMISSION] });
    const canDelete = useHasPermission({ anyOf: [ENVIRONMENT_GROUP_DELETE_PERMISSION] });

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_GROUP_LIST_PAGE_SIZE);
    const [sheet, setSheet] = useState<SheetState>({ type: 'closed' });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), GROUP_SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isError } = useGroupsPaged({ query: debouncedSearch, page, size: pageSize });
    const { data: apiRoles = [], isLoading: apiRolesLoading } = useGroupApiRoles();
    const { data: applicationRoles = [], isLoading: applicationRolesLoading } = useGroupApplicationRoles();

    const createMutation = useCreateGroup();
    const updateMutation = useUpdateGroup();
    const deleteMutation = useDeleteGroup();

    const groups = data?.data ?? [];
    const totalCount = data?.page.total_elements ?? 0;
    const isFirstUse = !isLoading && totalCount === 0 && !search.trim() && !debouncedSearch.trim();

    function handleSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    function closeSheet() {
        setSheet({ type: 'closed' });
    }

    function openCreateSheet() {
        setSheet({ type: 'create' });
    }

    async function handleCreate(values: GroupFormValues) {
        try {
            const created = await createMutation.mutateAsync({
                name: values.name,
                lock_api_role: values.lockApiRole,
                event_rules: buildEventRules(undefined, values.defaultGroupForNewApis),
            });

            if (values.apiRole || values.applicationRole) {
                const rolesUpdate: UpdateGroupPayload = {
                    name: created.name,
                    lock_api_role: created.lock_api_role ?? values.lockApiRole,
                    lock_api_product_role: created.lock_api_product_role ?? false,
                    lock_application_role: created.lock_application_role ?? false,
                    event_rules: created.event_rules ?? [],
                    roles: buildRolesMap(created.roles, values.apiRole, values.applicationRole),
                };
                await updateMutation.mutateAsync({ groupId: created.id, data: rolesUpdate });
            }

            notify.success('Group created successfully');
            closeSheet();
        } catch (error) {
            notify.error(error, 'Failed to create group');
        }
    }

    async function handleUpdate(values: GroupFormValues) {
        if (sheet.type !== 'edit') return;
        const group = sheet.group;
        try {
            await updateMutation.mutateAsync({
                groupId: group.id,
                data: {
                    name: values.name,
                    lock_api_role: values.lockApiRole,
                    lock_api_product_role: group.lock_api_product_role ?? false,
                    lock_application_role: group.lock_application_role ?? false,
                    event_rules: buildEventRules(group.event_rules, values.defaultGroupForNewApis),
                    roles: buildRolesMap(group.roles, values.apiRole, values.applicationRole),
                },
            });
            notify.success('Group updated successfully');
            closeSheet();
        } catch (error) {
            notify.error(error, 'Failed to update group');
        }
    }

    async function handleDelete() {
        if (sheet.type !== 'delete') return;
        try {
            await deleteMutation.mutateAsync(sheet.group.id);
            notify.success('Group deleted successfully');
            closeSheet();
        } catch (error) {
            notify.error(error, 'Failed to delete group');
        }
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">Failed to load groups. Please refresh and try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">User Groups</h1>
                    <p className="text-sm text-muted-foreground">
                        Organize users into groups to share default roles and simplify access management.
                    </p>
                </div>
                {canCreate && !isFirstUse ? (
                    <Button className="shrink-0" size="sm" onClick={openCreateSheet}>
                        <PlusIcon className="size-4" aria-hidden />
                        Create Group
                    </Button>
                ) : null}
            </div>

            <GroupsTable
                groups={groups}
                totalCount={totalCount}
                loading={isLoading}
                isFirstUse={isFirstUse}
                search={search}
                page={page}
                pageSize={pageSize}
                canEdit={canEdit}
                canDelete={canDelete}
                onSearchChange={handleSearchChange}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onEdit={group => setSheet({ type: 'edit', group })}
                onDelete={group => setSheet({ type: 'delete', group })}
                onCreateGroup={canCreate ? openCreateSheet : undefined}
            />

            <GroupSheet
                open={sheet.type === 'create' || sheet.type === 'edit'}
                mode={sheet.type === 'edit' ? 'edit' : 'create'}
                group={sheet.type === 'edit' ? sheet.group : undefined}
                apiRoles={apiRoles}
                applicationRoles={applicationRoles}
                rolesLoading={apiRolesLoading || applicationRolesLoading}
                onClose={closeSheet}
                onSubmit={sheet.type === 'edit' ? handleUpdate : handleCreate}
                isSaving={createMutation.isPending || updateMutation.isPending}
            />

            <GroupDeleteSheet
                open={sheet.type === 'delete'}
                group={sheet.type === 'delete' ? sheet.group : undefined}
                onClose={closeSheet}
                onConfirm={handleDelete}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
}
