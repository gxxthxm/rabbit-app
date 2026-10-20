// Sample content: listings, neighborhoods, agents and Buyer School guides.
// Every listing, price and person here is example data for the prototype.

(function (R) {
  const hoods = {
    riverside: { name: 'Riverside', blurb: 'Parks, a riverfront trail and the quickest commute downtown.', img: 'ext-juniper' },
    oldtown: { name: 'Old Town', blurb: 'Brick lofts, record shops and late-night food.', img: 'ext-linden' },
    waterfront: { name: 'Waterfront', blurb: 'Harbor views, ferries and sunset walks.', img: 'ext-quay' },
    midtown: { name: 'Midtown', blurb: 'Offices, gyms and the best transit links in the city.', img: 'ext-orchard' },
  };

  const agents = {
    maya: { name: 'Maya Chen', first: 'Maya', initials: 'MC', tone: '#144B5C' },
    jordan: { name: 'Jordan Ellis', first: 'Jordan', initials: 'JE', tone: '#485274' },
    priya: { name: 'Priya Nair', first: 'Priya', initials: 'PN', tone: '#544374' },
  };

  // Canonical feature tags, with the icon each one uses.
  const tagIcons = {
    'Pet friendly': 'paw',
    Parking: 'car',
    'In-unit laundry': 'washer',
    Gym: 'gym',
    Balcony: 'layers',
    'Near transit': 'train',
    'Rooftop deck': 'sun',
    Pool: 'wave',
    Concierge: 'bell',
    'Exposed brick': 'brick',
    'Water view': 'wave',
    'Storage locker': 'box',
    'Bike storage': 'bike',
    Dishwasher: 'drop',
  };
  const musts = ['Pet friendly', 'Parking', 'In-unit laundry', 'Gym', 'Balcony', 'Near transit'];

  // Photos from Pexels (pexels.com), stored in assets/photos. Credits: [photographer, Pexels photo slug].
  const photos = {
    'ext-juniper': ['Андрей', 'view-of-residential-buildings-in-a-city-8063958'],
    'ext-maple': ['Willian Justen de Vasconcellos', 'brick-building-with-modern-industrial-design-29560594'],
    'ext-harbor': ['The Six', 'modern-vancouver-skyline-by-the-water-33247909'],
    'ext-cedar': ['SHOX ART', 'modern-apartment-building-with-green-courtyard-31656168'],
    'ext-alder': ['Luis Quintero', 'minimalist-photography-of-white-and-gray-condominium-2091634'],
    'ext-linden': ['ha ha', 'buildings-with-terraces-16345410'],
    'ext-orchard': ['alex ohan', 'low-angle-shot-of-a-modernist-block-of-flats-16816523'],
    'ext-quay': ['Maximilian Ruther', 'illuminated-buildings-near-calm-waters-under-a-gray-sky-11557790'],
    'living-1': ['Zak Chapman', 'living-room-furniture-set-2030037'],
    'living-2': ['I’m Zion', 'sofa-in-a-spacious-living-room-9494898'],
    'living-3': ['Peter Vang', 'bright-modern-living-room-with-hardwood-floor-36816986'],
    'living-4': ['Max Vakhtbovych', 'modern-living-room-design-with-corner-sofa-6920439'],
    'loft-1': ['Max Vakhtbovych', 'brick-walls-inside-an-apartment-7587819'],
    'kitchen-1': ['Lisa Anna', 'kitchen-with-white-cabinets-and-silver-appliances-19846388'],
    'kitchen-2': ['Mateusz Pielech', 'modern-minimalist-white-kitchen-interior-29252561'],
    'kitchen-3': ['Arina Krasnikova', 'wide-angle-shot-of-an-apartment-kitchen-5712145'],
    'kitchen-4': ['Lisa Anna', 'small-white-kitchen-with-window-19857231'],
    'bed-1': ['Lachlan Ross', 'cozy-bed-with-colorful-pillow-and-coverlet-in-light-bedroom-6510421'],
    'bed-2': ['Peter Vang', 'cozy-minimalist-bedroom-with-grey-accents-35618218'],
    'bed-3': ['Max Vakhtbovych', 'modern-bedroom-interior-design-8135505'],
    'bed-4': ['Le Barbu La Conciergerie du Barbu', 'cozy-modern-bedroom-with-natural-light-37369025'],
    'bath-1': ['Max Vakhtbovych', 'toilet-and-sink-in-modern-light-bathroom-6890406'],
    'bath-2': ['Max Vakhtbovych', 'interior-of-modern-bathroom-with-glass-shower-cabin-7005268'],
    'studio-1': ['Max Vakhtbovych', 'apartment-studio-interior-8142976'],
    'studio-2': ['Max Vakhtbovych', 'modern-flat-with-cozy-bed-and-loft-style-lamp-6782426'],
  };
  const ROOM = { ext: 'Building exterior', living: 'Living room', loft: 'Living room with brick walls', kitchen: 'Kitchen', bed: 'Bedroom', bath: 'Bathroom', studio: 'Studio' };
  const imgAlt = (key) => ROOM[key.split('-')[0]];

  const listings = [
    {
      id: 'juniper-1204', name: 'The Juniper', unit: 'Unit 1204', hood: 'riverside',
      price: 189000, was: 199000, beds: 1, baths: 1, sqft: 640, floor: 12, built: '2009',
      hoa: 310, condition: 'Like new', exposure: 'South-facing', parking: 'Garage spot', listed: 3,
      tags: ['In-unit laundry', 'Gym', 'Rooftop deck', 'Pet friendly', 'Near transit'],
      images: ['ext-juniper', 'living-1', 'kitchen-1', 'bed-1', 'bath-1'], badge: 'Price drop', agent: 'maya',
      score: 92, reserve: 'Healthy · 68% funded', transit: '4 min walk to Riverside station', pin: [34, 46],
      summary: 'A bright corner one-bedroom on the 12th floor with river views from the living room. The owners replaced the windows in 2021 and the kitchen appliances are two years old.',
      inspection: [['Windows', 'Replaced 2021', 'good'], ['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['Flooring', 'Light wear in hallway', 'ok']],
    },
    {
      id: 'maple-4b', name: 'Maple Lofts', unit: 'Unit 4B', hood: 'oldtown',
      price: 246500, beds: 2, baths: 1, sqft: 880, floor: 4, built: '1924, converted 2016',
      hoa: 285, condition: 'Good', exposure: 'East-facing', parking: 'Street permit', listed: 1,
      tags: ['Exposed brick', 'Bike storage', 'Storage locker', 'Dishwasher', 'Near transit'],
      images: ['ext-maple', 'loft-1', 'kitchen-4', 'bed-3'], badge: 'New', agent: 'jordan',
      score: 86, reserve: 'Healthy · 55% funded', transit: '6 min walk to Old Town station', pin: [58, 30],
      summary: 'A converted warehouse loft with 11-foot ceilings, original brick and big factory windows. The second bedroom works well as a studio or office.',
      inspection: [['Roof', 'Replaced 2019', 'good'], ['Plumbing', 'Older pipes, working well', 'ok'], ['Electrical', 'Updated 2016', 'good'], ['Windows', 'Original, some drafts', 'ok']],
    },
    {
      id: 'harbor-1207', name: 'Harbor View', unit: 'Unit 1207', hood: 'waterfront',
      price: 159000, beds: 0, baths: 1, sqft: 480, floor: 12, built: '2004',
      hoa: 260, condition: 'Good', exposure: 'West-facing', parking: 'None', listed: 9,
      tags: ['Water view', 'Concierge', 'Pool', 'Gym'],
      images: ['ext-harbor', 'studio-1', 'studio-2', 'bath-2'], badge: 'Great value', agent: 'priya',
      score: 84, reserve: 'Fair · 41% funded', transit: '3 min walk to the ferry', pin: [72, 70],
      summary: 'A compact studio with sunset views over the harbor. Built-in storage and a Murphy bed make the space work harder than its size suggests.',
      inspection: [['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['Appliances', 'Original, working', 'ok'], ['Balcony door', 'Seal needs replacing', 'fix']],
    },
    {
      id: 'cedar-302', name: 'Cedar Commons', unit: 'Unit 302', hood: 'midtown',
      price: 289000, beds: 2, baths: 2, sqft: 1020, floor: 3, built: '2014',
      hoa: 340, condition: 'Like new', exposure: 'South-facing', parking: 'Garage spot', listed: 5,
      tags: ['Parking', 'Balcony', 'Dishwasher', 'Gym', 'In-unit laundry'],
      images: ['ext-cedar', 'kitchen-3', 'living-3', 'bed-4', 'bath-1'], badge: null, agent: 'maya',
      score: 95, reserve: 'Strong · 82% funded', transit: '2 min walk to Midtown Central', pin: [46, 58],
      summary: 'Two real bedrooms, two full baths and a balcony big enough for a table. Good for splitting with a roommate or growing into.',
      inspection: [['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['HVAC', 'Serviced 2025', 'good'], ['Appliances', '3 yrs old', 'good']],
    },
    {
      id: 'alder-808', name: 'Alder House', unit: 'Unit 808', hood: 'riverside',
      price: 214000, was: 222000, beds: 1, den: true, baths: 1, sqft: 720, floor: 8, built: '2011',
      hoa: 295, condition: 'Good', exposure: 'North-facing', parking: 'Garage spot', listed: 12,
      tags: ['Parking', 'Pet friendly', 'Gym', 'Dishwasher'],
      images: ['ext-alder', 'living-4', 'bed-2', 'kitchen-2'], badge: 'Price drop', agent: 'jordan',
      score: 88, reserve: 'Healthy · 60% funded', transit: '7 min walk to Riverside station', pin: [24, 62],
      summary: 'A one-bedroom with a den that fits a desk and a guest bed. It sits on the quiet side of the building, close to the river trail.',
      inspection: [['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['Windows', 'Original, sealed', 'ok'], ['Water heater', 'Due for service', 'fix']],
    },
    {
      id: 'linden-2c', name: 'Linden Court', unit: 'Unit 2C', hood: 'oldtown',
      price: 172500, beds: 1, baths: 1, sqft: 590, floor: 2, built: '1962, renovated 2020',
      hoa: 220, condition: 'Lived-in', exposure: 'West-facing', parking: 'Street permit', listed: 20,
      tags: ['Pet friendly', 'Storage locker', 'Near transit', 'Bike storage'],
      images: ['ext-linden', 'living-2', 'kitchen-4', 'bed-1'], badge: null, agent: 'priya',
      score: 79, reserve: 'Fair · 38% funded', transit: '5 min walk to Old Town station', pin: [64, 40],
      summary: 'The lowest HOA in Old Town and a leafy courtyard view. The kitchen is dated, which is reflected in the price.',
      inspection: [['Roof', 'Replaced 2020', 'good'], ['Plumbing', 'Working, older fixtures', 'ok'], ['Kitchen cabinets', 'Dated, functional', 'fix'], ['Electrical', 'Updated 2020', 'good']],
    },
    {
      id: 'orchard-1510', name: 'Orchard Tower', unit: 'Unit 1510', hood: 'midtown',
      price: 265000, beds: 2, baths: 1, sqft: 900, floor: 15, built: '2007',
      hoa: 360, condition: 'Good', exposure: 'East-facing', parking: 'Garage spot', listed: 2,
      tags: ['Rooftop deck', 'Concierge', 'Gym', 'Parking', 'In-unit laundry'],
      images: ['ext-orchard', 'living-4', 'kitchen-1', 'bed-3', 'bath-2'], badge: 'New', agent: 'maya',
      score: 90, reserve: 'Healthy · 64% funded', transit: '4 min walk to Midtown Central', pin: [52, 50],
      summary: 'Morning light, a split floor plan and a rooftop deck with skyline views. The building has a 24-hour front desk for packages.',
      inspection: [['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['Flooring', 'Refinished 2024', 'good'], ['Dishwasher', 'Needs a new rack', 'ok']],
    },
    {
      id: 'quay-405', name: 'The Quay', unit: 'Unit 405', hood: 'waterfront',
      price: 229000, beds: 1, baths: 1, sqft: 700, floor: 4, built: '2016',
      hoa: 330, condition: 'Like new', exposure: 'South-facing', parking: 'Garage spot', listed: 6,
      tags: ['Water view', 'Balcony', 'Pool', 'Parking', 'Pet friendly'],
      images: ['ext-quay', 'living-3', 'bed-2', 'kitchen-3', 'bath-2'], badge: null, agent: 'priya',
      score: 93, reserve: 'Strong · 77% funded', transit: '6 min walk to the ferry', pin: [80, 56],
      summary: 'A one-bedroom with a private balcony over the marina and floor-to-ceiling windows. The pool deck is one floor down.',
      inspection: [['Plumbing', 'No issues found', 'good'], ['Electrical', 'Up to code', 'good'], ['Windows', 'Original 2016, sealed', 'good'], ['Appliances', '4 yrs old', 'good']],
    },
  ];

  const guides = [
    {
      id: 'down-payment', title: 'How much do you really need to put down?', mins: 4, icon: 'bank', tone: 'carrot',
      body: [
        'Twenty percent down is the number everyone quotes, but it isn’t a requirement. Many first-time buyer loans accept 3 to 5 percent down.',
        'The trade-off is private mortgage insurance (PMI). With less than 20 percent down on a conventional loan, you’ll usually pay PMI each month until you build enough equity.',
        'Budget for costs on top of the down payment too: closing costs, moving, and a cushion for the first repair. Keep a few months of expenses in savings after you buy.',
        'Open the offer builder on any Rabbit listing to see how 3, 5, 10 and 20 percent down change your monthly payment.',
      ],
    },
    {
      id: 'hoa', title: 'What an HOA fee actually pays for', mins: 3, icon: 'building', tone: 'leaf',
      body: [
        'Every condo building has a homeowners association (HOA) that looks after the shared parts of the building. Your monthly fee funds it.',
        'Fees usually cover building insurance, shared utilities like water and trash, cleaning, landscaping and amenities such as a gym or pool.',
        'Part of every fee goes into the reserve fund, the savings account for big repairs like a new roof or elevator. A well-funded reserve makes surprise special assessments less likely.',
        'Each Rabbit listing shows the HOA fee and how well funded the reserve is, so you can compare buildings fairly.',
      ],
    },
    {
      id: 'tour', title: 'Your first condo tour: a checklist', mins: 5, icon: 'calendar', tone: 'sky',
      body: [
        'Run every tap and flush every toilet. Check the water pressure and how long the hot water takes to arrive.',
        'Open the windows and doors, and look for stains on ceilings, around windows and under sinks.',
        'Walk the shared spaces: hallways, the garage, the trash room. They tell you how well the building is run.',
        'Ask the agent for the HOA meeting minutes from the last year. They show what owners are worried about and whether big repairs are coming.',
      ],
    },
    {
      id: 'offer', title: 'Making an offer on a pre-loved condo', mins: 4, icon: 'doc', tone: 'sand',
      body: [
        'Start from the inspection. Items marked as needing work are fair to factor into your price.',
        'Contingencies protect you. An inspection contingency lets you walk away if a serious problem turns up, and a financing contingency protects you if your loan falls through.',
        'Your good-faith deposit shows the seller you’re serious. On Rabbit it’s refunded if the seller declines or you withdraw before acceptance.',
        'If the seller counters, you can accept, decline or come back with a new number. It’s a conversation.',
      ],
    },
  ];

  const byId = (id) => listings.find((l) => l.id === id);

  R.data = { hoods, agents, tagIcons, musts, photos, imgAlt, listings, guides, byId };
})((window.Rabbit = window.Rabbit || {}));
