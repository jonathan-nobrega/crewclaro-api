import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TranslationQueue } from "../queue/translation.queue";
import { RealtimeGateway } from "../realtime/realtime.gateway";

const PAGE = 50;

@Injectable()
export class MessagesService {
  constructor(
    private db: PrismaService,
    private queue: TranslationQueue,
    private realtime: RealtimeGateway,
  ) {}

  async list(projectId: string, lang: string, cursor?: string) {
    const rows = await this.db.message.findMany({
      where: { projectId },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
      take: PAGE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > PAGE;
    return { data: rows.slice(0, PAGE).map(toDto), nextCursor: hasMore ? rows[PAGE - 1].id : null };
  }

  async send(projectId: string, user: { id: string; lang: string }, text: string, attachments: string[]) {
    const msg = await this.db.message.create({
      data: { projectId, senderId: user.id, originalLang: user.lang, originalText: text, attachments },
      include: { sender: true },
    });
    const targetLangs = (process.env.SUPPORTED_LANGS ?? "en,es").split(",").filter((l) => l !== user.lang);
    await this.queue.enqueue({ messageId: msg.id, text, sourceLang: user.lang, targetLangs });
    const dto = toDto(msg);
    this.realtime.emit(projectId, "message.created", dto);
    return dto;
  }
}

function toDto(m: any) {
  return {
    id: m.id,
    projectId: m.projectId,
    sender: { id: m.sender.id, name: m.sender.name, lang: m.sender.lang },
    original: { lang: m.originalLang, text: m.originalText },
    translations: m.translations,
    translationStatus: m.translationStatus,
    attachments: m.attachments,
    createdAt: m.createdAt,
  };
}
