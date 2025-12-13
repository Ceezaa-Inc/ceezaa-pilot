import { MoodType } from './taste';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  mood: MoodType;
  venueIds: string[];
  imageUrl?: string;
  venueCount: number;
}

export const PLAYLISTS: Playlist[] = [
  {
    id: 'pl1',
    name: 'Date Night Gems',
    description: 'Romantic spots perfect for two',
    mood: 'romantic',
    venueIds: ['1', '6', '10', '13'],
    venueCount: 4,
  },
  {
    id: 'pl2',
    name: 'Weekend Brunch',
    description: 'Best morning bites in town',
    mood: 'cozy',
    venueIds: ['2', '18'],
    venueCount: 2,
  },
  {
    id: 'pl3',
    name: 'Happy Hour Hits',
    description: 'Great drinks and vibes',
    mood: 'social',
    venueIds: ['4', '8', '13'],
    venueCount: 3,
  },
  {
    id: 'pl4',
    name: 'Hidden Gems',
    description: 'Under-the-radar favorites',
    mood: 'adventurous',
    venueIds: ['3', '9', '12', '20'],
    venueCount: 4,
  },
  {
    id: 'pl5',
    name: 'Quick Bites',
    description: 'Fast and delicious',
    mood: 'chill',
    venueIds: ['11', '14', '19'],
    venueCount: 3,
  },
];

export const getPlaylistById = (id: string): Playlist | undefined => {
  return PLAYLISTS.find((playlist) => playlist.id === id);
};

export const getPlaylistsByMood = (mood: MoodType): Playlist[] => {
  return PLAYLISTS.filter((playlist) => playlist.mood === mood);
};
