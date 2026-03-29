import { Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/contract.service';
import { createContractSchema, updateContractStatusSchema } from '../validators/vendor.validators';
import { ContractStatus } from '../models/eventVendor.model';
import { AppError } from '../middleware/errorHandler';

const contractService = new ContractService();

export class ContractController {
  async hireVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createContractSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid contract data', parsed.error.errors);
      }

      const contract = await contractService.createContract(
        { event_id: req.params.id, ...parsed.data },
        req.user!.userId
      );

      res.status(201).json({ success: true, data: contract });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateContractStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status data', parsed.error.errors);
      }

      const contract = await contractService.updateContractStatus(
        req.params.id,
        parsed.data.status as ContractStatus,
        req.user!.userId,
        parsed.data.notes
      );

      res.json({ success: true, data: contract });
    } catch (err) {
      next(err);
    }
  }

  async getByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contracts = await contractService.getContractsByEvent(req.params.id);
      res.json({ success: true, data: contracts });
    } catch (err) {
      next(err);
    }
  }
}
