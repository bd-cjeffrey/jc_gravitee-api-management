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

/** Mirrors classic `GroupEventRuleEntity` — `API_CREATE` is "default group for new APIs". */
export type GroupEventName = 'API_CREATE' | 'APPLICATION_CREATE' | 'API_PRODUCT_CREATE';

export interface GroupEventRule {
    event: GroupEventName;
}

/** v1 `GroupEntity` (GET .../configuration/groups...). */
export interface Group {
    id: string;
    name: string;
    event_rules?: GroupEventRule[];
    manageable?: boolean;
    roles?: Record<string, string>;
    created_at?: number;
    updated_at?: number;
    lock_api_role?: boolean;
    lock_api_product_role?: boolean;
    lock_application_role?: boolean;
}

export interface GroupsPageMeta {
    current: number;
    size: number;
    per_page: number;
    total_pages: number;
    total_elements: number;
}

/** v1 `PagedResult<GroupEntity>` (GET .../configuration/groups/_paged). */
export interface GroupsPagedResponse {
    data: Group[];
    metadata?: Record<string, Record<string, unknown>>;
    page: GroupsPageMeta;
}

/** v1 `NewGroupEntity` (POST .../configuration/groups). No `roles` — set via a follow-up update. */
export interface NewGroupPayload {
    name: string;
    lock_api_role: boolean;
    event_rules: GroupEventRule[];
}

/** v1 `UpdateGroupEntity` (PUT .../configuration/groups/{id}). */
export interface UpdateGroupPayload {
    name: string;
    lock_api_role: boolean;
    lock_api_product_role: boolean;
    lock_application_role: boolean;
    event_rules: GroupEventRule[];
    roles?: Record<string, string>;
}

/** v1 role (GET .../configuration/rolescopes/{scope}/roles). */
export interface GroupRole {
    name: string;
    scope: string;
    system?: boolean;
    default?: boolean;
}
