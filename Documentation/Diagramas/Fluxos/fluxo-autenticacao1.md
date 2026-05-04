# Fluxo de Autenticação

## Conceito e Objetivo
O sistema de autenticação da plataforma garante que apenas colaboradores autorizados acedem às funcionalidades da plataforma. Para tal, é utilizado um modelo híbrido: usando Firebase Authentication para gerir a segurança, identidades e passwords (suportando OAuth da Google e Email/Password), e sincroniza esses dados com uma Base de Dados PostgreSQL (através de Drizzle ORM) que gere as permissões e o perfil na plataforma.

## Processo de Entrada na Plataforma
O acesso de um utilizador à plataforma divide-se em três fases essenciais:
1. **Login e Registo**: O utilizador acede à plataforma e escolhe autenticar-se via Google ou com E-mail e Palavra-passe. Todo este processo inicial é gerido pelos servidores Google/Firebase, garantindo encriptação.
2. **Sincronização Automática**: Assim que o Firebase valida a identidade do utilizador, o Frontend capta esse sinal e envia os dados básicos (E-mail, Firebase ID e Nome do Google) para o backend. Aqui, o sistema toma uma decisão automática:
    - se for um utilizador existente, o sistema atualiza apenas dados voláteis (como a foto de perfil do Google) e permite a entrada, preservando qualquer edição prévia que o utilizador tenha feito no seu perfil;
    - se for um utilizador novo, o sistema cria um novo perfil na base de dados de forma silenciosa e automática. Gera um username baseado no e-mail e aplica o nome fornecido pelo Google, sem obrigar o utilizador a preencher formulários extensos.

## Barreira de Segurança
Para evitar contas falsas ou acessos indevidos, a plataforma implementa uma barreira de segurança rigorosa.

- Quando um novo utilizador é sincronizado, a sua flag de acesso é marcada como 'Requer Verificação de E-mail'.
- O sistema bloqueia o acesso ao dashboard e redireciona o utilizador para uma página de 'Verificação Pendente'.
- Simultaneamente, o SendGrid dispara um e-mail com um código OTP de 6 dígitos.
- Apenas quando o utilizador insere o código e o backend valida , a conta é marcada como 'Verificada' e o acesso total à plataforma é desbloqueado.

**NOTA**: A edição de informações adicionais, como o número de telemóvel, dados do veículo e regras de viagem, não é obrigatória no momento do registo. O utilizador pode preencher estes dados mais tarde na sua página de Perfil, garantindo uma entrada rápida e sem fricção na plataforma.

[Fluxo de Autenticação](fluxo-autenticacao.md)
