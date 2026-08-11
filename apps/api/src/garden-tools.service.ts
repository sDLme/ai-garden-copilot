import {
  ApprovalDecisionResponse,
  ApprovalRequest,
  CreateObservationInput,
  GardenToolCall,
  GardenToolName,
  Plant
} from "../../shared/src";
import { GardenRepository } from "./garden.repository";

export class GardenToolsService {
  private readonly approvals = new Map<string, ApprovalRequest>();

  constructor(private readonly repository: GardenRepository) {}

  listPlants(): Plant[] {
    return this.repository.listPlants();
  }

  getPlant(plantId: string): Plant | undefined {
    return this.repository.getPlant(plantId);
  }

  createToolCall(name: GardenToolName, input: Record<string, unknown>): GardenToolCall {
    return {
      id: `${name}-${crypto.randomUUID()}`,
      name,
      status: "running",
      input
    };
  }

  createObservationApproval(plantId: string, input: CreateObservationInput, label: string, description: string): ApprovalRequest {
    const approval: ApprovalRequest = {
      id: `approval-${crypto.randomUUID()}`,
      plantId,
      action: "saveObservation",
      label,
      description,
      input,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    this.approvals.set(approval.id, approval);
    return structuredClone(approval);
  }

  approve(approvalId: string): ApprovalDecisionResponse | undefined {
    const approval = this.approvals.get(approvalId);

    if (!approval || approval.status !== "pending") {
      return undefined;
    }

    const observation = this.repository.addObservation(approval.plantId, approval.input);

    if (!observation) {
      return undefined;
    }

    const approved: ApprovalRequest = {
      ...approval,
      status: "approved"
    };

    this.approvals.set(approvalId, approved);

    return {
      approval: structuredClone(approved),
      observation
    };
  }

  reject(approvalId: string): ApprovalDecisionResponse | undefined {
    const approval = this.approvals.get(approvalId);

    if (!approval || approval.status !== "pending") {
      return undefined;
    }

    const rejected: ApprovalRequest = {
      ...approval,
      status: "rejected"
    };

    this.approvals.set(approvalId, rejected);

    return {
      approval: structuredClone(rejected)
    };
  }
}
