import { vi } from "vitest";

export function createDealRecordRepositoryMock(overrides: {
  findById?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  updateStatus?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    findById: overrides.findById ?? vi.fn(),
    update: overrides.update ?? vi.fn(),
    updateStatus: overrides.updateStatus ?? vi.fn(),
  };
}

export function createTrainingPathRecordRepositoryMock(overrides: {
  findById?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  updateStatus?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    findById: overrides.findById ?? vi.fn(),
    update: overrides.update ?? vi.fn(),
    updateStatus: overrides.updateStatus ?? vi.fn(),
  };
}

export function createConsultationRequestRepositoryMock(overrides: {
  findById?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    findById: overrides.findById ?? vi.fn(),
  };
}

export function createLeadRecordRepositoryMock(overrides: {
  findById?: ReturnType<typeof vi.fn>;
  updateTriageState?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    findById: overrides.findById ?? vi.fn(),
    updateTriageState: overrides.updateTriageState ?? vi.fn(),
  };
}

export function createConversationEventRecorderMock(overrides: {
  record?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    record: overrides.record ?? vi.fn(),
  };
}
