import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { APP_MODE } from '@consts/app-mode'
import { join } from 'path'
import { NestExpressApplication } from '@nestjs/platform-express'

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
  if (APP_MODE === 'development') {
    SwaggerModule.setup('public/docs', app, document)
  }

  // Serve static assets from the client directory
  app.useStaticAssets(join(__dirname, '..', '..', 'client'))

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, '..', '..', 'client', 'index.html'))
    } else {
      next()
    }
  })

  await app.listen(4000)
}
bootstrap()
