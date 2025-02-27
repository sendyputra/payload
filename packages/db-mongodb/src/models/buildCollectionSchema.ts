import type { PaginateOptions, Schema } from 'mongoose'
import type { Payload, SanitizedCollectionConfig } from 'payload'

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildCollectionSchema = (
  collection: SanitizedCollectionConfig,
  payload: Payload,
  schemaOptions = {},
): Schema => {
  const schema = buildSchema({
    buildSchemaOptions: {
      draftsEnabled: Boolean(
        typeof collection?.versions === 'object' && collection.versions.drafts,
      ),
      indexSortableFields: payload.config.indexSortableFields,
      options: {
        minimize: false,
        timestamps: collection.timestamps !== false,
        ...schemaOptions,
      },
    },
    configFields: collection.fields,
    payload,
  })

  if (Array.isArray(collection.upload.filenameCompoundIndex)) {
    const indexDefinition: Record<string, 1> = collection.upload.filenameCompoundIndex.reduce(
      (acc, index) => {
        acc[index] = 1
        return acc
      },
      {},
    )

    schema.index(indexDefinition, { unique: true })
  }

  schema
    .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }))

  if (
    Object.keys(collection.joins).length > 0 ||
    Object.keys(collection.polymorphicJoins).length > 0
  ) {
    schema.plugin(mongooseAggregatePaginate)
  }

  return schema
}
