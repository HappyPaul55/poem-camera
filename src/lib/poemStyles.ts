const poemStyles = {
  "Theme": [
    { name: "Love" },
    { name: "Nature" },
    { name: "Spiritual" },
    { name: "Humorous" },
    { name: "Philosophical" },
    { name: "Confessional" },
  ],

  "Classical and Ancient Poets": [
    { name: "Homer", description: "Ancient Greece", tags: ["The Iliad", "The Odyssey"] },
    { name: "Sappho", description: "Ancient Greece", tags: ["Lyric poetry"] },
    { name: "Virgil", description: "Ancient Rome", tags: ["The Aeneid"] },
    { name: "Horace", description: "Ancient Rome", tags: ["Odes", "Satires"] },
    { name: "Ovid", description: "Ancient Rome", tags: ["Metamorphoses"] },
    { name: "Li Bai", description: "China (Tang Dynasty)", tags: ["Romantic poetry"] },
    { name: "Du Fu", description: "China (Tang Dynasty)", tags: ["Historical and reflective poetry"] },
    { name: "Rumi", description: "Persia", tags: ["Mystical Sufi poetry"] },
    { name: "Kabir", description: "India", tags: ["Bhakti and Sufi poetry"] },
    { name: "Dante Alighieri", description: "Italy", tags: ["The Divine Comedy"] }
  ],
  "Medieval and Renaissance Poets": [
    { name: "Geoffrey Chaucer", description: "England", tags: ["The Canterbury Tales"] },
    { name: "Petrarch", description: "Italy", tags: ["Sonnet master"] },
    { name: "William Langland", description: "England", tags: ["Piers Plowman"] },
    { name: "Edmund Spenser", description: "England", tags: ["The Faerie Queene"] },
    { name: "Luis de Góngora", description: "Spain", tags: ["Baroque poetry"] },
    { name: "John Donne", description: "England", tags: ["Metaphysical poetry"] },
    { name: "George Herbert", description: "England", tags: ["Religious poetry"] },
    { name: "Pierre de Ronsard", description: "France", tags: ["Renaissance poetry"] }
  ],
  "Romantic and Victorian Era Poets": [
    { name: "William Wordsworth", description: "England", tags: ["Lyrical Ballads"] },
    { name: "Samuel Taylor Coleridge", description: "England", tags: ["The Rime of the Ancient Mariner"] },
    { name: "Lord Byron", description: "England", tags: ["Don Juan"] },
    { name: "Percy Bysshe Shelley", description: "England", tags: ["Ozymandias"] },
    { name: "John Keats", description: "England", tags: ["Ode to a Nightingale"] },
    { name: "Alfred, Lord Tennyson", description: "England", tags: ["In Memoriam A.H.H."] },
    { name: "Robert Browning", description: "England", tags: ["My Last Duchess"] },
    { name: "Elizabeth Barrett Browning", description: "England", tags: ["Sonnets from the Portuguese"] },
    { name: "Emily Brontë", description: "England", tags: ["Poems in Gondal saga"] },
    { name: "Walt Whitman", description: "USA", tags: ["Leaves of Grass"] }
  ],
  "Modern and Contemporary Poets": [
    { name: "Emily Dickinson", description: "USA", tags: ["Lyric poetry"] },
    { name: "William Butler Yeats", description: "Ireland", tags: ["The Second Coming"] },
    { name: "T.S. Eliot", description: "USA/UK", tags: ["The Waste Land"] },
    { name: "Robert Frost", description: "USA", tags: ["The Road Not Taken"] },
    { name: "Langston Hughes", description: "USA", tags: ["Harlem Renaissance poetry"] },
    { name: "Pablo Neruda", description: "Chile", tags: ["Twenty Love Poems and a Song of Despair"] },
    { name: "Sylvia Plath", description: "USA", tags: ["Ariel"] },
    { name: "Anne Sexton", description: "USA", tags: ["Confessional poetry"] },
    { name: "Seamus Heaney", description: "Ireland", tags: ["Death of a Naturalist"] },
    { name: "Matsuo Bashō", description: "Japan", tags: ["Haiku poetry"] }
  ],
  "Non-Western and World Poets": [
    { name: "Rabindranath Tagore", description: "India", tags: ["Gitanjali"] },
    { name: "Mahmoud Darwish", description: "Palestine", tags: ["Resistance poetry"] },
    { name: "Octavio Paz", description: "Mexico", tags: ["Sunstone"] },
    { name: "Nazim Hikmet", description: "Turkey", tags: ["Socialist poetry"] },
    { name: "Adrienne Rich", description: "USA", tags: ["Feminist and political poetry"] },
    { name: "Rainer Maria Rilke", description: "Germany", tags: ["Duino Elegies"] },
    { name: "Hafiz", description: "Persia", tags: ["Ghazals"] },
    { name: "Amrita Pritam", description: "India", tags: ["Ajj Aakhaan Waris Shah Nu"] },
    { name: "Kamala Das", description: "India", tags: ["Feminist and confessional poetry"] },
    { name: "Chinua Achebe", description: "Nigeria", tags: ["Poetic and narrative blend"] }
  ],
  "Influential 20th and 21st Century Poets": [
    { name: "Maya Angelou", description: "USA", tags: ["Still I Rise"] },
    { name: "Carol Ann Duffy", description: "UK", tags: ["First female Poet Laureate of the UK"] }
  ]
} as const;

export type PoemStyleNames = (typeof poemStyles[keyof typeof poemStyles][number]["name"]);

export default poemStyles;