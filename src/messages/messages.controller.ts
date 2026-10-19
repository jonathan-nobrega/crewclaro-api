import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { MessagesService } from "./messages.service";

@Controller("projects/:id/messages")
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get()
  list(@Param("id") projectId: string, @Query("lang") lang: string, @Query("cursor") cursor?: string) {
    return this.messages.list(projectId, lang, cursor);
  }

  @Post()
  send(@Param("id") projectId: string, @Body() body: { body: string; attachments?: string[] }, @Req() req: any) {
    return this.messages.send(projectId, req.user, body.body, body.attachments ?? []);
  }
}
