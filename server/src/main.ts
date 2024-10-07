import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { APP_MODE } from '@consts/app-mode'
import * as serveStatic from 'serve-static'
import { join } from 'path'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()
  app.enableVersioning()

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Eventify API')
    .setVersion('1.0')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  app.useStaticAssets(join(__dirname, '..','..', 'client'));

  // Barcha noto'g'ri route'lar uchun index.html ni serve qilish
  app.use('*', express.static(join(__dirname, '..','..', 'client', 'index.html')));


  if (APP_MODE === 'development') {
    SwaggerModule.setup('public/docs', app, document)
  }
  
  await app.listen(4000)
}
bootstrap()
