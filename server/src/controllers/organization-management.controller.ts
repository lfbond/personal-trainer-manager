
import type { RequestHandler } from 'express'

import {
  listOrganizations,
  createOrganization,
  listOrganizationMembers,
  createOrganizationTrainer,
  updateOrganizationMember,
} from '../services/organization-management.service.js'

import {
  organizationIdParamsSchema,
  organizationMemberParamsSchema,
  createOrganizationSchema,
  createOrganizationTrainerSchema,
  updateOrganizationMemberSchema,
} from '../schemas/organization-management.schema.js'

export const listOrganizationsController: RequestHandler =
  async (_req, res) => {
    const organizations = await listOrganizations()

    res.status(200).json(organizations)
  }

export const createOrganizationController: RequestHandler =
  async (req, res) => {
    const data = createOrganizationSchema.parse(req.body)

    const organization = await createOrganization(data)

    res.status(201).json(organization)
  }

export const listOrganizationMembersController: RequestHandler =
  async (req, res) => {
    const { organizationId } =
      organizationIdParamsSchema.parse(req.params)

    const members = await listOrganizationMembers(
      organizationId,
    )

    res.status(200).json(members)
  }

export const createOrganizationTrainerController: RequestHandler =
  async (req, res) => {
    const { organizationId } =
      organizationIdParamsSchema.parse(req.params)

    const data =
      createOrganizationTrainerSchema.parse(req.body)

    const trainer = await createOrganizationTrainer({
      organizationId,
      ...data,
    })

    res.status(201).json(trainer)
  }

export const updateOrganizationMemberController: RequestHandler =
  async (req, res) => {
    const { organizationId, memberId } =
      organizationMemberParamsSchema.parse(req.params)

    const data =
      updateOrganizationMemberSchema.parse(req.body)

    const member = await updateOrganizationMember({
      organizationId,
      memberId,
      ...data,
    })

    res.status(200).json(member)
  }
