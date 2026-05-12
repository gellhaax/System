import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post(`${this.baseUrl}/login`, { username, password });
  }

  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  getStudents() {
    return this.http.get<any[]>(`${this.baseUrl}/students`);
  }

  getStudent(studentId: string) {
    return this.http.get<any>(`${this.baseUrl}/students/${studentId}`);
  }

  addStudent(data: any) {
    return this.http.post(`${this.baseUrl}/students`, data);
  }

  updateStudent(studentId: string, data: any) {
    return this.http.put(`${this.baseUrl}/students/${studentId}`, data);
  }

  deleteStudent(studentId: string) {
    return this.http.delete(`${this.baseUrl}/students/${studentId}`);
  }

  addTransaction(data: any) {
    return this.http.post(`${this.baseUrl}/transactions`, data);
  }

  deleteTransaction(id: number) {
    return this.http.delete(`${this.baseUrl}/transactions/${id}`);
  }

  sendApproval(data: any) {
    return this.http.post(`${this.baseUrl}/approvals`, data);
  }

  getPendingApprovals() {
    return this.http.get<any[]>(`${this.baseUrl}/approvals/pending`);
  }

  respondToApproval(id: number, status: string) {
    return this.http.put(`${this.baseUrl}/approvals/${id}`, { status });
  }
}