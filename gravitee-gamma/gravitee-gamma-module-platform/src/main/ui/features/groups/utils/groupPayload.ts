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

import type { GroupEventRule } from '../types/group';

/** Keeps any other event rule (e.g. APPLICATION_CREATE) untouched — only toggles API_CREATE. */
export function buildEventRules(existingRules: GroupEventRule[] | undefined, defaultForNewApis: boolean): GroupEventRule[] {
    const others = (existingRules ?? []).filter(rule => rule.event !== 'API_CREATE');
    return defaultForNewApis ? [...others, { event: 'API_CREATE' }] : others;
}

/** Keeps any other role scope (e.g. API_PRODUCT) untouched — only sets/clears API and APPLICATION. */
export function buildRolesMap(
    existingRoles: Record<string, string> | undefined,
    apiRole: string,
    applicationRole: string,
): Record<string, string> | undefined {
    const roles = { ...(existingRoles ?? {}) };
    if (apiRole) {
        roles.API = apiRole;
    } else {
        delete roles.API;
    }
    if (applicationRole) {
        roles.APPLICATION = applicationRole;
    } else {
        delete roles.APPLICATION;
    }
    return Object.keys(roles).length > 0 ? roles : undefined;
}
