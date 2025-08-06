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

  // Serve static files from public directory with better configuration
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/',
    setHeaders: (res, path) => {
      // Set proper MIME types for HTML files
      if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
      }
      // Set cache headers for static assets
      res.setHeader('Cache-Control', 'public, max-age=3600')
    },
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

  console.log('🚀 Server running on http://localhost:4000')
  console.log('💰 Payment Testing: http://localhost:4000/payment-test.html')
  console.log('📚 API Documentation: http://localhost:4000/public/docs')
  console.log('🏥 Health Check: http://localhost:4000/api/v1/payment/health')
}
bootstrap()
