export interface ReadingQuestion {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ReadingPassage {
  id: number;
  level: string;
  title: string;
  passage: string;
  questions: ReadingQuestion[];
}

export const readingPassages: ReadingPassage[] = [
  { id: 1, level: 'A1', title: 'My Family',
    passage: 'Hello! My name is Tom. I am 10 years old. I live with my family. There are four people in my family: my father, my mother, my sister and me. My father is a doctor. My mother is a teacher. My sister is a student. I love my family very much. We have a dog. Its name is Max. Max is black and white.',
    questions: [{ q: 'How many people in Tom family?', options: ['Three', 'Four', 'Five', 'Six'], correctIndex: 1, explanation: 'Four people: father, mother, sister and Tom' }, { q: 'What is Tom father job?', options: ['Teacher', 'Doctor', 'Student', 'Driver'], correctIndex: 1, explanation: 'My father is a doctor' }, { q: 'What color is Max?', options: ['Black', 'White', 'Black and white', 'Brown'], correctIndex: 2, explanation: 'Max is black and white' }] },
  { id: 2, level: 'A1', title: 'My Day',
    passage: 'I wake up at 7 o clock every morning. I brush my teeth and wash my face. Then I eat breakfast. I have bread and milk. After breakfast I go to school. I have lunch at school. I go home at 5 o clock. I do my homework after dinner. I go to bed at 9 o clock.',
    questions: [{ q: 'What time does the writer wake up?', options: ['6:00', '7:00', '8:00', '5:00'], correctIndex: 1, explanation: 'I wake up at 7 o clock' }, { q: 'What for breakfast?', options: ['Rice and eggs', 'Bread and milk', 'Noodles', 'Cereal'], correctIndex: 1, explanation: 'I have bread and milk' }] },
  { id: 3, level: 'A1', title: 'At the Park',
    passage: 'It is a sunny day. Tom and his friend go to the park. There is a big lake in the park. They see ducks on the lake. Tom feeds the ducks some bread. They play on the swings. After two hours they go home. Tom is happy.',
    questions: [{ q: 'What is the weather like?', options: ['Rainy', 'Cloudy', 'Sunny', 'Snowy'], correctIndex: 2, explanation: 'It is a sunny day' }, { q: 'What do they see on the lake?', options: ['Fish', 'Boats', 'Ducks', 'Swans'], correctIndex: 2, explanation: 'They see ducks on the lake' }] },
  { id: 4, level: 'A2', title: 'Shopping for Clothes',
    passage: 'Last Saturday Sarah went shopping for her birthday party. She went to a big shopping mall. She tried on three dresses. A blue one was too small. A red one was too expensive. She found a nice yellow dress. It was not expensive. She bought it happily.',
    questions: [{ q: 'Why did Sarah go shopping?', options: ['For a wedding', 'For a birthday party', 'For an interview', 'For a trip'], correctIndex: 1, explanation: 'For her birthday party' }, { q: 'What color dress did she buy?', options: ['Blue', 'Red', 'Yellow', 'Green'], correctIndex: 2, explanation: 'She bought a yellow dress' }] },
  { id: 5, level: 'A2', title: 'A Trip to the Zoo',
    passage: 'Last Sunday our class went to the city zoo. We arrived at 9 a.m. First we saw the monkeys. They were very active and funny. Then we visited the elephants. They were huge but gentle. We saw lions tigers and giraffes too. At noon we had lunch near the lake.',
    questions: [{ q: 'What time did they arrive?', options: ['8 a.m.', '9 a.m.', '10 a.m.', '11 a.m.'], correctIndex: 1, explanation: 'Arrived at 9 a.m.' }, { q: 'Which animals first?', options: ['Elephants', 'Lions', 'Monkeys', 'Giraffes'], correctIndex: 2, explanation: 'First they saw the monkeys' }] },
  { id: 6, level: 'B1', title: 'Learning English Online',
    passage: 'More people are learning English online. There are websites and apps that help learners. Some apps teach vocabulary through games. Others focus on speaking with native speakers. The biggest advantage of online learning is flexibility. You can study at any time at your own pace. However you need to be self-disciplined. Many successful learners combine online tools with traditional classes.',
    questions: [{ q: 'What is the biggest advantage?', options: ['It is free', 'Flexibility', 'More teachers', 'No homework'], correctIndex: 1, explanation: 'Flexibility - study anytime at own pace' }, { q: 'What is a challenge?', options: ['Too many exercises', 'Need self-discipline', 'Not enough internet', 'Too expensive'], correctIndex: 1, explanation: 'You need to be self-disciplined' }] },
  { id: 7, level: 'B1', title: 'The Importance of Exercise',
    passage: 'Regular exercise is essential for good health. Doctors recommend 30 minutes of moderate exercise five times a week. Walking cycling and swimming are good choices. Exercise helps control your weight and reduces the risk of heart disease. It also improves your mood. When you exercise your body produces chemicals that make you feel happy.',
    questions: [{ q: 'How much exercise do doctors recommend?', options: ['30 min daily', '30 min 5 times a week', '1 hour daily', '20 min daily'], correctIndex: 1, explanation: '30 minutes five times a week' }, { q: 'What happens when you exercise?', options: ['Feel tired', 'Body produces happy chemicals', 'Need more sleep'], correctIndex: 1, explanation: 'Chemicals that make you feel happy' }] },
  { id: 8, level: 'B2', title: 'The Psychology of Habits',
    passage: 'Habits are automatic behaviors developed through repetition. Research shows it takes 66 days to form a habit not 21. The process involves three stages: cue routine and reward. The cue triggers the behavior. The routine is the behavior itself. The reward reinforces it. To break a bad habit identify the cue and reward then replace the routine.',
    questions: [{ q: 'How long to form a habit actually?', options: ['21 days', '66 days', '30 days', '90 days'], correctIndex: 1, explanation: '66 days on average' }, { q: 'What are the three stages?', options: ['Start middle end', 'Cue routine reward', 'Try fail succeed', 'Plan do check'], correctIndex: 1, explanation: 'Cue routine and reward' }] },
  { id: 9, level: 'B2', title: 'Remote Work Revolution',
    passage: 'The pandemic accelerated the shift towards remote work. Surveys show remote workers report higher job satisfaction and better work-life balance. They save time on commuting. However some struggle with loneliness. The boundary between work and personal life can blur. Many companies are adopting hybrid models combining remote work with occasional in-office days.',
    questions: [{ q: 'What accelerated remote work?', options: ['Technology', 'The pandemic', 'Government', 'Employee demands'], correctIndex: 1, explanation: 'The pandemic accelerated the shift' }, { q: 'What is a benefit?', options: ['More meetings', 'Better work-life balance', 'Longer hours', 'More office space'], correctIndex: 1, explanation: 'Better work-life balance' }] },
  { id: 10, level: 'C1', title: 'Climate Change Economics',
    passage: 'Climate change is an environmental crisis and an economic challenge. Global economic losses from extreme weather have increased five-fold since the 1970s. The costs of inaction exceed the investments required for mitigation. Transitioning to a low-carbon economy needs upfront investment in renewable energy. These investments create jobs and stimulate innovation.',
    questions: [{ q: 'How have losses changed?', options: ['Decreased', 'Increased five-fold', 'Stayed same', 'Doubled'], correctIndex: 1, explanation: 'Increased five-fold since the 1970s' }, { q: 'What do investments in renewable energy do?', options: ['Cost jobs', 'Create jobs and stimulate innovation', 'Increase emissions', 'Slow growth'], correctIndex: 1, explanation: 'Create jobs and stimulate innovation' }] },
  { id: 11, level: 'C1', title: 'Neuroscience and Memory',
    passage: 'Recent neuroscience advances show memories are distributed across neural networks rather than stored in specific brain regions. Memory consolidation occurs during sleep. Each time we recall a memory it becomes malleable and is reconsolidated. This explains why memories can change over time and has implications for treating PTSD.',
    questions: [{ q: 'How are memories stored?', options: ['In specific regions', 'Distributed across networks', 'In hippocampus only', 'In cortex only'], correctIndex: 1, explanation: 'Distributed across neural networks' }, { q: 'When does consolidation occur?', options: ['During waking', 'During sleep', 'During exercise', 'During meals'], correctIndex: 1, explanation: 'Primarily during sleep' }] },
  { id: 12, level: 'C2', title: 'Globalization and Its Discontents',
    passage: 'Globalization has been a transformative force facilitating economic growth and cultural exchange. Trade has lifted billions out of poverty. However benefits are not evenly distributed. Critics argue it has exacerbated income inequality led to labor exploitation and contributed to environmental degradation. Protectionist sentiments have risen challenging the consensus on free trade.',
    questions: [{ q: 'What has globalization done for poverty?', options: ['Increased poverty', 'Lifted billions out of poverty', 'No effect', 'Only helped wealthy'], correctIndex: 1, explanation: 'Lifted billions out of poverty' }, { q: 'What has risen recently?', options: ['Free trade', 'Protectionist sentiments', 'International cooperation', 'Immigration'], correctIndex: 1, explanation: 'Protectionist sentiments have risen' }] },
];
