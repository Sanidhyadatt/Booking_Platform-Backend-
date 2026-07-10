import { PrismaClient, BookingStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create ADMIN User
  const adminEmail = 'admin@booking.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
    await prisma.user.create({
      data: {
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // 2. Create Sample USER
  const userEmail = 'user@booking.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('UserPass123!', 10);
    await prisma.user.create({
      data: {
        name: 'Standard User',
        email: userEmail,
        password: hashedPassword,
        role: Role.USER,
      },
    });
    console.log(`Created standard user: ${userEmail}`);
  }

  // 3. Create Sample Services
  const servicesData = [
    {
      title: 'Haircut & Styling',
      description: 'Classic scissor haircut with professional wash, condition, and blowout styling.',
      duration: 45,
      price: 35.0,
      isActive: true,
    },
    {
      title: 'Massage Therapy',
      description: '60 minutes deep tissue Swedish therapeutic full-body oil massage.',
      duration: 60,
      price: 75.0,
      isActive: true,
    },
    {
      title: 'Dental Cleaning',
      description: 'Routine checkup, scaling, polishing, and comprehensive consultation.',
      duration: 30,
      price: 90.0,
      isActive: false, // Inactive service example
    },
  ];

  const services: any[] = [];
  for (const s of servicesData) {
    let service = await prisma.service.findFirst({
      where: { title: s.title },
    });
    if (!service) {
      service = await prisma.service.create({ data: s });
      console.log(`Created service: ${s.title}`);
    }
    services.push(service);
  }

  // 4. Create Sample Booking (placed in the future relative to current date)
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 5);
  bookingDate.setHours(0, 0, 0, 0);

  const existingBooking = await prisma.booking.findFirst({
    where: {
      serviceId: services[0].id,
      bookingDate,
      bookingTime: '14:00',
    },
  });

  if (!existingBooking) {
    await prisma.booking.create({
      data: {
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '+1987654321',
        bookingDate,
        bookingTime: '14:00',
        status: BookingStatus.PENDING,
        notes: 'Needs water and a window seat.',
        serviceId: services[0].id,
      },
    });
    console.log('Created sample booking for John Smith.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
