import { DocumentBuilder } from "@nestjs/swagger";

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Affiliates API')
  .setDescription(
    'This API provides endpoints to manage affiliates, including creating, updating, and retrieving affiliate information.',
  )
  .setVersion('1.0')
  .addTag('affiliates v1 ')
  .build();