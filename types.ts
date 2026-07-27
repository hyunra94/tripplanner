export type Trip = { id: string; title: string; place: string; date: string | null };

export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  memo: string;
  visitDate: string | null;
};

export type PackingItem = { id: string; name: string; done: boolean };
