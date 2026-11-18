import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';

class AuthRepository {
  AuthRepository();

  final Dio _dio = ApiClient.dio;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _tokenKey = 'access_token';

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email.trim().toLowerCase(), 'password': password},
    );

    final data = Map<String, dynamic>.from(response.data as Map);

    final token = data['accessToken'];

    if (token is! String || token.isEmpty) {
      throw const FormatException('A API não retornou um token válido.');
    }

    await _storage.write(key: _tokenKey, value: token);

    return data;
  }

  Future<String?> getToken() {
    return _storage.read(key: _tokenKey);
  }

  Future<void> logout() {
    return _storage.delete(key: _tokenKey);
  }
}
