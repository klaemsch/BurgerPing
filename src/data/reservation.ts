export interface Reservation {
    name: string;
    email: string;
    date: Date;
    personCount: number;
    dishCount?: [number, number, number];
    selected?: number[];
}