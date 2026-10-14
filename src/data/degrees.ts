import { EducationLevel } from '../types/bitlife';

export interface DegreeMajor {
  name: string;
  category: 'STEM' | 'Humanities' | 'Business' | 'Healthcare' | 'Arts';
  tuitionPerYear: number;
  smartsReq: number;
}

export const UNIVERSITY_MAJORS: DegreeMajor[] = [
  { name: 'Computer Science', category: 'STEM', tuitionPerYear: 24000, smartsReq: 65 },
  { name: 'Biology', category: 'Healthcare', tuitionPerYear: 22000, smartsReq: 60 },
  { name: 'Finance', category: 'Business', tuitionPerYear: 26000, smartsReq: 55 },
  { name: 'Political Science', category: 'Humanities', tuitionPerYear: 18000, smartsReq: 50 },
  { name: 'English Literature', category: 'Humanities', tuitionPerYear: 16000, smartsReq: 45 },
  { name: 'Nursing', category: 'Healthcare', tuitionPerYear: 20000, smartsReq: 55 },
  { name: 'Mechanical Engineering', category: 'STEM', tuitionPerYear: 25000, smartsReq: 70 },
  { name: 'Fine Arts', category: 'Arts', tuitionPerYear: 19000, smartsReq: 40 },
  { name: 'Music', category: 'Arts', tuitionPerYear: 18000, smartsReq: 40 },
  { name: 'Economics', category: 'Business', tuitionPerYear: 23000, smartsReq: 60 },
  { name: 'Psychology', category: 'Healthcare', tuitionPerYear: 20000, smartsReq: 50 },
  { name: 'Journalism', category: 'Humanities', tuitionPerYear: 18000, smartsReq: 50 },
];

export interface GraduateSchool {
  name: string;
  level: EducationLevel;
  requiredMajorCategories: string[];
  durationYears: number;
  tuitionPerYear: number;
  smartsReq: number;
}

export const GRADUATE_PROGRAMS: GraduateSchool[] = [
  {
    name: 'Medical School',
    level: 'Medical School',
    requiredMajorCategories: ['Healthcare', 'STEM'],
    durationYears: 4,
    tuitionPerYear: 45000,
    smartsReq: 80,
  },
  {
    name: 'Law School',
    level: 'Law School',
    requiredMajorCategories: ['Humanities', 'Business', 'STEM'],
    durationYears: 3,
    tuitionPerYear: 40000,
    smartsReq: 75,
  },
  {
    name: 'Business School (MBA)',
    level: 'Business School',
    requiredMajorCategories: ['Business', 'STEM', 'Humanities'],
    durationYears: 2,
    tuitionPerYear: 50000,
    smartsReq: 70,
  },
  {
    name: 'Graduate School (Master/Ph.D)',
    level: 'Graduate School',
    requiredMajorCategories: ['STEM', 'Humanities', 'Business', 'Healthcare', 'Arts'],
    durationYears: 2,
    tuitionPerYear: 28000,
    smartsReq: 65,
  },
];
