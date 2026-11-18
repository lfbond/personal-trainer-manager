import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:mobile/features/auth/presentation/login_page.dart';

void main() {
  group('Personal Trainer Manager - Autenticação', () {
    testWidgets('Deve apresentar os campos e o botão de login', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginPage()));

      expect(find.text('Personal Trainer Manager'), findsOneWidget);

      expect(find.text('E-mail'), findsOneWidget);

      expect(find.text('Senha'), findsOneWidget);

      expect(find.text('Entrar'), findsOneWidget);
    });

    testWidgets('Deve validar campos obrigatórios', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginPage()));

      await tester.tap(find.text('Entrar'));
      await tester.pump();

      expect(find.text('Informe seu e-mail.'), findsOneWidget);

      expect(find.text('Informe sua senha.'), findsOneWidget);
    });
  });
}
