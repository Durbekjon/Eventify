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

  // Serve uploaded files BEFORE setting global prefix
  app.useStaticAssets(join(__dirname, '..', '..', 'public', 'uploads'), {
    prefix: '/public/uploads/',
  })

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

  await app.listen(4000)
}
bootstrap()
