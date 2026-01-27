export interface NepalHolidayPreset {
  name: string;
  date: string; // YYYY-MM-DD format
  description?: string;
}

// Nepal Public Holidays for Fiscal Year 2082/83 (2025/2026 AD)
export const NEPAL_HOLIDAYS_2082_83: NepalHolidayPreset[] = [
  { name: "New Year's Day", date: "2026-01-01", description: "International New Year" },
  { name: "Prithvi Jayanti", date: "2026-01-11", description: "Birthday of Prithvi Narayan Shah" },
  { name: "Maghe Sankranti", date: "2026-01-14", description: "Start of Magh month" },
  { name: "Basant Panchami", date: "2026-02-03", description: "Saraswati Puja" },
  { name: "Maha Shivaratri", date: "2026-02-26", description: "Festival of Lord Shiva" },
  { name: "Fagu Purnima (Holi)", date: "2026-03-14", description: "Festival of Colors" },
  { name: "Ghode Jatra", date: "2026-03-31", description: "Horse Racing Festival" },
  { name: "Ram Nawami", date: "2026-04-06", description: "Lord Ram's Birthday" },
  { name: "Nepali New Year 2083", date: "2026-04-14", description: "Baisakh 1" },
  { name: "Buddha Jayanti", date: "2026-05-12", description: "Buddha's Birthday" },
  { name: "Republic Day", date: "2026-05-28", description: "National Day" },
  { name: "Janai Purnima", date: "2026-08-09", description: "Sacred Thread Festival" },
  { name: "Gai Jatra", date: "2026-08-10", description: "Cow Festival" },
  { name: "Krishna Janmashtami", date: "2026-08-16", description: "Lord Krishna's Birthday" },
  { name: "Teej", date: "2026-08-26", description: "Women's Festival" },
  { name: "Indra Jatra", date: "2026-09-06", description: "Chariot Festival" },
  { name: "Constitution Day", date: "2026-09-19", description: "National Day" },
  { name: "Ghatasthapana", date: "2026-09-22", description: "Start of Dashain" },
  { name: "Fulpati", date: "2026-09-28", description: "Dashain Day 7" },
  { name: "Maha Ashtami", date: "2026-09-29", description: "Dashain Day 8" },
  { name: "Maha Nawami", date: "2026-09-30", description: "Dashain Day 9" },
  { name: "Vijaya Dashami", date: "2026-10-01", description: "Dashain Day 10" },
  { name: "Tihar (Kukur Tihar)", date: "2026-10-20", description: "Tihar Day 2" },
  { name: "Tihar (Laxmi Puja)", date: "2026-10-21", description: "Tihar Day 3" },
  { name: "Tihar (Govardhan/Mha Puja)", date: "2026-10-22", description: "Tihar Day 4" },
  { name: "Tihar (Bhai Tika)", date: "2026-10-23", description: "Tihar Day 5" },
  { name: "Chhath Parva", date: "2026-10-28", description: "Sun Worship Festival" },
];

// Nepal Public Holidays for Fiscal Year 2083/84 (2026/2027 AD)
export const NEPAL_HOLIDAYS_2083_84: NepalHolidayPreset[] = [
  { name: "New Year's Day", date: "2027-01-01", description: "International New Year" },
  { name: "Prithvi Jayanti", date: "2027-01-11", description: "Birthday of Prithvi Narayan Shah" },
  { name: "Maghe Sankranti", date: "2027-01-14", description: "Start of Magh month" },
  { name: "Basant Panchami", date: "2027-01-24", description: "Saraswati Puja" },
  { name: "Maha Shivaratri", date: "2027-02-15", description: "Festival of Lord Shiva" },
  { name: "Fagu Purnima (Holi)", date: "2027-03-03", description: "Festival of Colors" },
  { name: "Ghode Jatra", date: "2027-03-20", description: "Horse Racing Festival" },
  { name: "Ram Nawami", date: "2027-03-26", description: "Lord Ram's Birthday" },
  { name: "Nepali New Year 2084", date: "2027-04-14", description: "Baisakh 1" },
  { name: "Buddha Jayanti", date: "2027-05-02", description: "Buddha's Birthday" },
  { name: "Republic Day", date: "2027-05-28", description: "National Day" },
  { name: "Janai Purnima", date: "2027-07-29", description: "Sacred Thread Festival" },
  { name: "Gai Jatra", date: "2027-07-30", description: "Cow Festival" },
  { name: "Krishna Janmashtami", date: "2027-08-05", description: "Lord Krishna's Birthday" },
  { name: "Teej", date: "2027-08-15", description: "Women's Festival" },
  { name: "Indra Jatra", date: "2027-08-27", description: "Chariot Festival" },
  { name: "Constitution Day", date: "2027-09-19", description: "National Day" },
  { name: "Ghatasthapana", date: "2027-09-11", description: "Start of Dashain" },
  { name: "Fulpati", date: "2027-09-17", description: "Dashain Day 7" },
  { name: "Maha Ashtami", date: "2027-09-18", description: "Dashain Day 8" },
  { name: "Maha Nawami", date: "2027-09-19", description: "Dashain Day 9" },
  { name: "Vijaya Dashami", date: "2027-09-20", description: "Dashain Day 10" },
  { name: "Tihar (Kukur Tihar)", date: "2027-10-09", description: "Tihar Day 2" },
  { name: "Tihar (Laxmi Puja)", date: "2027-10-10", description: "Tihar Day 3" },
  { name: "Tihar (Govardhan/Mha Puja)", date: "2027-10-11", description: "Tihar Day 4" },
  { name: "Tihar (Bhai Tika)", date: "2027-10-12", description: "Tihar Day 5" },
  { name: "Chhath Parva", date: "2027-10-17", description: "Sun Worship Festival" },
];

export const NEPAL_HOLIDAY_PRESETS = {
  '2082/83': NEPAL_HOLIDAYS_2082_83,
  '2083/84': NEPAL_HOLIDAYS_2083_84,
};
