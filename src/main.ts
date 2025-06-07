import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'PUT', 'DELETE'],
  });

  const config = new DocumentBuilder()
    .setTitle('API Trabalho POS')
    .setDescription('API para CRUDS de produto')
    .setVersion('1.0')
    .addTag('Produto')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 8083);
}

bootstrap();
