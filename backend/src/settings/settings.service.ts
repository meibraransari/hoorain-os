import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../database/entities/app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly appSettingRepo: Repository<AppSetting>,
  ) {}

  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.appSettingRepo.find();
    const result: Record<string, any> = {};
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value);
      } catch (e) {
        result[setting.key] = setting.value;
      }
    }
    return result;
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      const existing = await this.appSettingRepo.findOne({ where: { key } });
      if (existing) {
        existing.value = stringValue;
        await this.appSettingRepo.save(existing);
      } else {
        const newSetting = this.appSettingRepo.create({ key, value: stringValue });
        await this.appSettingRepo.save(newSetting);
      }
    }
  }

  async getSetting(key: string): Promise<any> {
    const setting = await this.appSettingRepo.findOne({ where: { key } });
    if (!setting) return null;
    try {
      return JSON.parse(setting.value);
    } catch (e) {
      return setting.value;
    }
  }
}
