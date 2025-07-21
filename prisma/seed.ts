import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default categories
  const categories = [
    {
      name: 'Action',
      nameAr: 'أكشن',
      slug: 'action',
      description: 'High-energy manga with intense fight scenes, battles, and adventures'
    },
    {
      name: 'Adventure',
      nameAr: 'مغامرة',
      slug: 'adventure',
      description: 'Stories featuring exciting journeys, exploration, and discovery'
    },
    {
      name: 'Comedy',
      nameAr: 'كوميديا',
      slug: 'comedy',
      description: 'Humorous manga designed to entertain and make readers laugh'
    },
    {
      name: 'Drama',
      nameAr: 'دراما',
      slug: 'drama',
      description: 'Serious storytelling focusing on character development and emotions'
    },
    {
      name: 'Fantasy',
      nameAr: 'خيال',
      slug: 'fantasy',
      description: 'Stories set in magical worlds with supernatural elements'
    },
    {
      name: 'Horror',
      nameAr: 'رعب',
      slug: 'horror',
      description: 'Dark manga designed to frighten, unsettle, and create suspense'
    },
    {
      name: 'Romance',
      nameAr: 'رومانسية',
      slug: 'romance',
      description: 'Stories focusing on love relationships and romantic connections'
    },
    {
      name: 'Sci-Fi',
      nameAr: 'خيال علمي',
      slug: 'sci-fi',
      description: 'Science fiction manga with futuristic technology and concepts'
    },
    {
      name: 'Slice of Life',
      nameAr: 'شريحة من الحياة',
      slug: 'slice-of-life',
      description: 'Realistic stories depicting everyday life and mundane experiences'
    },
    {
      name: 'Sports',
      nameAr: 'رياضة',
      slug: 'sports',
      description: 'Manga focused on athletic competitions and sports activities'
    },
    {
      name: 'Supernatural',
      nameAr: 'خارق للطبيعة',
      slug: 'supernatural',
      description: 'Stories involving paranormal phenomena and otherworldly elements'
    },
    {
      name: 'Thriller',
      nameAr: 'إثارة',
      slug: 'thriller',
      description: 'Suspenseful manga with tension, mystery, and unexpected twists'
    }
  ];

  console.log('Creating categories...');
  
  for (const category of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: category.slug }
    });

    if (!existingCategory) {
      const createdCategory = await prisma.category.create({
        data: category
      });
      console.log(`✅ Created category: ${createdCategory.name} (${createdCategory.nameAr})`);
    } else {
      console.log(`⏭️  Category already exists: ${existingCategory.name}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
