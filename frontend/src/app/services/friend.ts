import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number;
  username: string;
}

export interface FriendshipDto {
  id: number;
  requester: UserDto;
  receiver: UserDto;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'http://localhost:8080/api/friends';

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<UserDto[]> {
    const normalizedQuery = query.trim();
    const params = new HttpParams().set('query', normalizedQuery);
    return this.http.get<UserDto[]>(`${this.apiUrl}/search`, { params });
  }

  sendRequest(receiverId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/request/${receiverId}`, {}, { responseType: 'text' });
  }

  getPendingRequests(): Observable<FriendshipDto[]> {
    return this.http.get<FriendshipDto[]>(`${this.apiUrl}/pending`);
  }

  getFriendsList(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/list`);
  }

  acceptRequest(friendshipId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/accept/${friendshipId}`, {}, { responseType: 'text' });
  }

  rejectRequest(friendshipId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/reject/${friendshipId}`, {}, { responseType: 'text' });
  }
}
