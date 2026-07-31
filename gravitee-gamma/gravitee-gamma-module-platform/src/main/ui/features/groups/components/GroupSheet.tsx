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

import {
    Button,
    Field,
    FieldLabel,
    Input,
    ScrollArea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    Switch,
} from '@gravitee/graphene-core';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { STANDARD_SHEET_WIDTH } from '../../applications/components/sheetLayout';
import type { Group, GroupRole } from '../types/group';

export type GroupSheetMode = 'create' | 'edit';

export interface GroupFormValues {
    name: string;
    lockApiRole: boolean;
    defaultGroupForNewApis: boolean;
    apiRole: string;
    applicationRole: string;
}

const NO_ROLE_VALUE = '__none__';

function defaultRoleValue(roles: GroupRole[]): string {
    return roles.find(role => role.default)?.name ?? '';
}

function buildEmptyForm(apiRoles: GroupRole[], applicationRoles: GroupRole[]): GroupFormValues {
    return {
        name: '',
        lockApiRole: true,
        defaultGroupForNewApis: false,
        apiRole: defaultRoleValue(apiRoles),
        applicationRole: defaultRoleValue(applicationRoles),
    };
}

function buildFormFromGroup(group: Group): GroupFormValues {
    return {
        name: group.name,
        lockApiRole: Boolean(group.lock_api_role),
        defaultGroupForNewApis: (group.event_rules ?? []).some(rule => rule.event === 'API_CREATE'),
        apiRole: group.roles?.API ?? '',
        applicationRole: group.roles?.APPLICATION ?? '',
    };
}

export function GroupSheet({
    open,
    mode,
    group,
    apiRoles,
    applicationRoles,
    rolesLoading,
    onClose,
    onSubmit,
    isSaving,
}: Readonly<{
    open: boolean;
    mode: GroupSheetMode;
    group?: Group;
    apiRoles: GroupRole[];
    applicationRoles: GroupRole[];
    rolesLoading: boolean;
    onClose: () => void;
    onSubmit: (values: GroupFormValues) => void;
    isSaving: boolean;
}>) {
    const [form, setForm] = useState<GroupFormValues>(() => buildEmptyForm([], []));
    const [initialForm, setInitialForm] = useState<GroupFormValues | null>(null);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && group) {
            const initial = buildFormFromGroup(group);
            setForm(initial);
            setInitialForm(initial);
        } else {
            const initial = buildEmptyForm(apiRoles, applicationRoles);
            setForm(initial);
            setInitialForm(null);
        }
        // Roles only need to seed the create-mode defaults once, when the sheet opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, group]);

    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!isOpen) onClose();
        },
        [onClose],
    );

    function setField<K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    const isValid = form.name.trim() !== '';

    const hasChanged = useMemo(() => {
        if (mode === 'create') return true;
        if (!initialForm) return false;
        return (
            form.name !== initialForm.name ||
            form.lockApiRole !== initialForm.lockApiRole ||
            form.defaultGroupForNewApis !== initialForm.defaultGroupForNewApis ||
            form.apiRole !== initialForm.apiRole ||
            form.applicationRole !== initialForm.applicationRole
        );
    }, [mode, form, initialForm]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid || !hasChanged) return;
        onSubmit({ ...form, name: form.name.trim() });
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="right" className="flex max-h-full flex-col" style={{ maxWidth: STANDARD_SHEET_WIDTH }}>
                <SheetHeader>
                    <SheetTitle>{mode === 'create' ? 'Create group' : 'Edit group'}</SheetTitle>
                    <SheetDescription>
                        {mode === 'create'
                            ? 'New groups can receive default API and application roles, and be used in IdP group mappings.'
                            : 'Update the group name, default roles, and API association settings.'}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0">
                    <form id="group-form" onSubmit={handleSubmit} className="flex flex-col gap-5 px-1 py-4">
                        <Field orientation="vertical" className="gap-1.5">
                            <FieldLabel htmlFor="group-name">
                                Name{' '}
                                <span className="text-destructive" aria-hidden>
                                    *
                                </span>
                            </FieldLabel>
                            <Input
                                id="group-name"
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="e.g. Support Team"
                                disabled={isSaving}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field orientation="vertical" className="gap-1.5">
                                <FieldLabel htmlFor="group-api-role">Default API role</FieldLabel>
                                <Select
                                    value={form.apiRole || NO_ROLE_VALUE}
                                    onValueChange={val => setField('apiRole', val === NO_ROLE_VALUE ? '' : val)}
                                    disabled={isSaving || rolesLoading}
                                >
                                    <SelectTrigger id="group-api-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_ROLE_VALUE}>None</SelectItem>
                                        {apiRoles.map(role => (
                                            <SelectItem key={role.name} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field orientation="vertical" className="gap-1.5">
                                <FieldLabel htmlFor="group-application-role">Default application role</FieldLabel>
                                <Select
                                    value={form.applicationRole || NO_ROLE_VALUE}
                                    onValueChange={val => setField('applicationRole', val === NO_ROLE_VALUE ? '' : val)}
                                    disabled={isSaving || rolesLoading}
                                >
                                    <SelectTrigger id="group-application-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_ROLE_VALUE}>None</SelectItem>
                                        {applicationRoles.map(role => (
                                            <SelectItem key={role.name} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                            <div className="space-y-0.5">
                                <FieldLabel htmlFor="group-lock-api-role">Lock API role</FieldLabel>
                                <p className="text-xs text-muted-foreground">Members can&apos;t self-upgrade API role in this group.</p>
                            </div>
                            <Switch
                                id="group-lock-api-role"
                                checked={form.lockApiRole}
                                onCheckedChange={val => setField('lockApiRole', val)}
                                disabled={isSaving}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                            <div className="space-y-0.5">
                                <FieldLabel htmlFor="group-default-for-new-apis">Default group for new APIs</FieldLabel>
                                <p className="text-xs text-muted-foreground">Newly created APIs grant this group access automatically.</p>
                            </div>
                            <Switch
                                id="group-default-for-new-apis"
                                checked={form.defaultGroupForNewApis}
                                onCheckedChange={val => setField('defaultGroupForNewApis', val)}
                                disabled={isSaving}
                            />
                        </div>
                    </form>
                </ScrollArea>

                <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="group-form" disabled={!isValid || !hasChanged || isSaving}>
                        {isSaving ? (mode === 'create' ? 'Creating…' : 'Saving…') : mode === 'create' ? 'Create group' : 'Save'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
