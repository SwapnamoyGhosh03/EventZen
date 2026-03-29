import { v4 as uuidv4 } from 'uuid';
import { EventVendor, ContractStatus, IEventVendor } from '../models/eventVendor.model';
import { Vendor } from '../models/vendor.model';
import { AppError } from '../middleware/errorHandler';
import { publishEvent } from '../events/kafkaProducer';

interface CreateContractInput {
  event_id: string;
  vendor_id: string;
  service_description?: string;
  agreed_price: number;
  currency: string;
}

export class ContractService {
  async createContract(input: CreateContractInput, userId: string): Promise<IEventVendor> {
    // Verify vendor exists
    const vendor = await Vendor.findOne({ vendor_id: input.vendor_id });
    if (!vendor) {
      throw new AppError(404, 'EVT-3001', 'Vendor not found');
    }

    if (!vendor.is_active) {
      throw new AppError(400, 'EVT-3002', 'Vendor is not active');
    }

    const contract = new EventVendor({
      contract_id: uuidv4(),
      event_id: input.event_id,
      vendor_id: input.vendor_id,
      service_description: input.service_description,
      agreed_price: input.agreed_price,
      currency: input.currency,
      status: ContractStatus.PENDING,
      created_by: userId,
      version_history: [
        {
          version: 1,
          status: ContractStatus.PENDING,
          changed_by: userId,
          changed_at: new Date(),
          notes: 'Contract created',
        },
      ],
    });

    return contract.save();
  }

  async updateContractStatus(
    contractId: string,
    newStatus: ContractStatus,
    userId: string,
    notes?: string
  ): Promise<IEventVendor> {
    const contract = await EventVendor.findOne({ contract_id: contractId });
    if (!contract) {
      throw new AppError(404, 'EVT-4001', 'Contract not found');
    }

    const currentVersion = contract.version_history.length;
    contract.status = newStatus;

    if (newStatus === ContractStatus.SIGNED) {
      contract.signed_at = new Date();
    }

    contract.version_history.push({
      version: currentVersion + 1,
      status: newStatus,
      changed_by: userId,
      changed_at: new Date(),
      notes,
    });

    const saved = await contract.save();

    if (newStatus === ContractStatus.SIGNED) {
      await publishEvent('vendor.contract.signed', {
        contract_id: saved.contract_id,
        event_id: saved.event_id,
        vendor_id: saved.vendor_id,
        agreed_price: saved.agreed_price,
        currency: saved.currency,
        signed_at: saved.signed_at?.toISOString(),
      });
    }

    return saved;
  }

  async getContractsByEvent(eventId: string) {
    return EventVendor.find({ event_id: eventId }).sort({ createdAt: -1 });
  }

  async getContractById(contractId: string): Promise<IEventVendor> {
    const contract = await EventVendor.findOne({ contract_id: contractId });
    if (!contract) {
      throw new AppError(404, 'EVT-4001', 'Contract not found');
    }
    return contract;
  }
}
