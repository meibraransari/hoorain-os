import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AdminSeederService {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed() {
    let admin = await this.userRepository.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const passwordHash = await bcrypt.hash('AdminPass123!', 10);
      admin = this.userRepository.create({
        username: 'admin',
        email: 'admin@financeos.local',
        passwordHash,
        role: UserRole.ADMIN,
        mustChangePassword: false,
        isActive: true,
      });

      await this.userRepository.save(admin);

      console.log(`
╔══════════════════════════════════════╗
║     FinanceOS — First Boot Setup     ║
╠══════════════════════════════════════╣
║  Admin Account Created               ║
║  Username: admin                     ║
║  Password: AdminPass123!             ║
╚══════════════════════════════════════╝
      `);
    }
  }
}
