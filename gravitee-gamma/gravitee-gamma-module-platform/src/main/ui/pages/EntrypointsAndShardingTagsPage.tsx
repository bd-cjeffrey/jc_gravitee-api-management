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

import { useHasFeature, useHasPermission } from '@gravitee/gamma-modules-sdk';
import { Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@gravitee/graphene-core';
import { InfoIcon } from '@gravitee/graphene-core/icons';
import { useState } from 'react';

import { EntrypointConfigurationSection } from '../features/entrypoints/components/EntrypointConfigurationSection';
import { EntrypointDetailSheet } from '../features/entrypoints/components/EntrypointDetailSheet';
import { EntrypointMappingsTable } from '../features/entrypoints/components/EntrypointMappingsTable';
import { ShardingTagDetailSheet } from '../features/entrypoints/components/ShardingTagDetailSheet';
import { ShardingTagsLicenseDialog } from '../features/entrypoints/components/ShardingTagsLicenseDialog';
import { CreateShardingTagButton, ShardingTagsTable } from '../features/entrypoints/components/ShardingTagsTable';
import { useEntrypointConfigurations } from '../features/entrypoints/hooks/useEntrypointConfigurations';
import { useEntrypointMappings } from '../features/entrypoints/hooks/useEntrypointMappings';
import { useShardingTags } from '../features/entrypoints/hooks/useShardingTags';
import { SHARDING_TAGS_LICENSE_FEATURE } from '../features/entrypoints/license/shardingTagsLicense';
import type { EntrypointMappingRow, ShardingTagRow } from '../features/entrypoints/types/entrypoint';

export function EntrypointsAndShardingTagsPage() {
    const { data: configurationData, isLoading: isConfigurationLoading, isError: isConfigurationError } = useEntrypointConfigurations();
    const { rows, isLoading: isMappingsLoading, isError: isMappingsError, isNameResolutionError } = useEntrypointMappings();
    const { rows: tagRows, isLoading: isTagsLoading, isError: isTagsError, isGroupNameResolutionError } = useShardingTags();

    const canReadTags = useHasPermission({ anyOf: ['environment-tag-r', 'organization-tag-r'] });
    const canCreateTag = useHasPermission({ anyOf: ['environment-tag-c', 'organization-tag-c'] });
    const hasShardingTagsLicense = useHasFeature(SHARDING_TAGS_LICENSE_FEATURE);

    const [selectedMapping, setSelectedMapping] = useState<EntrypointMappingRow | null>(null);
    const [selectedTag, setSelectedTag] = useState<ShardingTagRow | null>(null);
    const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);

    function handleUpgrade() {
        setLicenseDialogOpen(true);
    }

    function handleCreateTag() {
        if (!hasShardingTagsLicense) {
            handleUpgrade();
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Entrypoints & Sharding Tags</h1>
                <p className="text-sm text-muted-foreground">
                    View entrypoint configuration and mappings used by the Developer Portal based on API sharding tags.
                </p>
            </div>

            <Alert>
                <InfoIcon className="size-4" aria-hidden />
                <AlertDescription>
                    Include entrypoint and sharding tag configuration according to the values already used by the deployed API Gateway(s).
                </AlertDescription>
            </Alert>

            <EntrypointConfigurationSection
                configs={configurationData?.configs ?? []}
                failedEnvironmentNames={configurationData?.failedEnvironmentNames ?? []}
                isLoading={isConfigurationLoading}
                isError={isConfigurationError}
            />

            {canReadTags ? (
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle>Sharding Tags</CardTitle>
                            <CardDescription>Tags used to route APIs to specific gateway groups</CardDescription>
                        </div>
                        {canCreateTag && tagRows.length > 0 ? (
                            <CreateShardingTagButton
                                hasLicense={hasShardingTagsLicense}
                                onCreate={handleCreateTag}
                                onUpgrade={handleUpgrade}
                            />
                        ) : null}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Alert>
                            <InfoIcon className="size-4" aria-hidden />
                            <AlertDescription>
                                Add the sharding tag&apos;s key to the API Gateway configuration file to manage API deployments.
                            </AlertDescription>
                        </Alert>
                        {isGroupNameResolutionError && !isTagsLoading && !isTagsError ? (
                            <Alert>
                                <InfoIcon className="size-4" aria-hidden />
                                <AlertDescription>
                                    Some restricted group names could not be loaded. IDs may be shown instead of display names.
                                </AlertDescription>
                            </Alert>
                        ) : null}
                        {isTagsLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                                ))}
                            </div>
                        ) : isTagsError ? (
                            <Alert variant="destructive">
                                <AlertDescription>Failed to load sharding tags. Please refresh and try again.</AlertDescription>
                            </Alert>
                        ) : (
                            <ShardingTagsTable
                                rows={tagRows}
                                canCreate={canCreateTag}
                                hasLicense={hasShardingTagsLicense}
                                onOpenDetail={setSelectedTag}
                                onCreate={handleCreateTag}
                                onUpgrade={handleUpgrade}
                            />
                        )}
                    </CardContent>
                </Card>
            ) : null}

            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1.5">
                        <CardTitle>Entrypoint Mappings</CardTitle>
                        <CardDescription>Entrypoint to be displayed in the Developer Portal if an API has a given tag</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isNameResolutionError && !isMappingsLoading && !isMappingsError ? (
                        <Alert>
                            <InfoIcon className="size-4" aria-hidden />
                            <AlertDescription>
                                Some environment or sharding tag names could not be loaded. IDs may be shown instead of display names.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                    {isMappingsLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </div>
                    ) : isMappingsError ? (
                        <Alert variant="destructive">
                            <AlertDescription>Failed to load entrypoint mappings. Please refresh and try again.</AlertDescription>
                        </Alert>
                    ) : (
                        <EntrypointMappingsTable rows={rows} canCreate={false} onOpenDetail={setSelectedMapping} />
                    )}
                </CardContent>
            </Card>

            <EntrypointDetailSheet entrypoint={selectedMapping} onClose={() => setSelectedMapping(null)} />
            <ShardingTagDetailSheet tag={selectedTag} onClose={() => setSelectedTag(null)} />
            <ShardingTagsLicenseDialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen} />
        </div>
    );
}
