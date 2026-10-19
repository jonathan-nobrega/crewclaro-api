import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "../prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { TranslationJob, TranslationResult } from "./translation.types";

export const JOBS_KEY = "translation:jobs";
export const DONE_CHANNEL = "translation:done";

@Injectable()
export class TranslationQueue implements OnModuleInit {
  private pub = new Redis(process.env.REDIS_URL!);
  private sub = new Redis(process.env.REDIS_URL!);

  constructor(private db: PrismaService, private realtime: RealtimeGateway) {}

  enqueue(job: TranslationJob) {
    return this.pub.lpush(JOBS_KEY, JSON.stringify(job));
  }

  async onModuleInit() {
    await this.sub.subscribe(DONE_CHANNEL);
    this.sub.on("message", async (_channel, raw) => {
      const result: TranslationResult = JSON.parse(raw);
      const msg = await this.db.message.update({
        where: { id: result.messageId },
        data: { translations: result.translations, translationStatus: result.status },
      });
      this.realtime.emit(msg.projectId, "message.translated", {
        id: msg.id, translations: msg.translations, translationStatus: msg.translationStatus,
      });
    });
  }
}
