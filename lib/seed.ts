import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import "dotenv/config";

const prisma = new PrismaClient();

function parseDate(dateString: string): Date | null {
  if (!dateString) {
    console.warn(`Date string is empty or undefined.`);
    return null;
  }

  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[1].padStart(2, '0');
    const month = parts[0].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      year = '20' + year; // Assuming all dates are in the 21st century
    }
    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  console.warn(`Could not parse date: ${dateString}`);
  return null;
}

export async function seed() {
  const prisma = new PrismaClient();

  // Remove all existing data
  await prisma.unicorns.deleteMany();
  console.log('Cleared "unicorns" table');

  const results: any[] = [];
  const csvFilePath = path.join(process.cwd(), 'unicorns.csv');

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        headers: ['Company', 'Valuation ($B)', 'Date Joined', 'Country', 'City', 'Industry', 'Select Investors'],
        mapHeaders: ({ header }) => header.trim()
      }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of results) {
    // Validate required fields
    console.log(row);

    if (!row.Company) {
      console.warn(`Company name is missing at row ${results.indexOf(row) + 1}. Skipping this record.`);
      continue;
    }

    const valuationString = row['Valuation ($B)']?.replace('$', '').replace(',', '');
    const valuation = parseFloat(valuationString);

    if (isNaN(valuation)) {
      console.warn(`Invalid valuation for company ${row.Company} at row ${results.indexOf(row) + 1}. Skipping this record.`);
      continue;
    }

    const dateJoined = parseDate(row['Date Joined']);

    try {
      await prisma.unicorns.create({
        data: {
          company: row.Company,
          valuation: valuation,
          date_joined: dateJoined,
          country: row.Country || 'Unknown',
          city: row.City || 'Unknown',
          industry: row.Industry || 'Unknown',
          select_investors: row['Select Investors'] || 'Unknown',
        },
      });
      console.log(`Inserted company: ${row.Company}`);
    } catch (error) {
      console.error(`Error inserting company ${row.Company}:`, error);
    }
  }

  // Query total number of companies
  const totalCompanies = await prisma.unicorns.count();
  console.log(`Total number of companies: ${totalCompanies}`);

  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});