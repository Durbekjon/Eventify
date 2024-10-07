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

  app.use(serveStatic(join(__dirname, '..', 'public')))

  if (APP_MODE === 'development') {
    SwaggerModule.setup('public/docs', app, document)
  }

  // Fallback route to serve index.html for any unmatched routes
  app.use('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'))
  })

  await app.listen(4000)
}
bootstrap()
