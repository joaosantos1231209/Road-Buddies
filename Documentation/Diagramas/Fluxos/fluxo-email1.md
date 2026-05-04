# Fluxo de Notificações por E-mail

## Conceito e Objetivo

O sistema de notificações da plataforma atua como o principal canal de comunicação assíncrona com os utilizadores. A sua função é manter condutores e passageiros informados sobre os estados das suas viagens, garantindo que ninguém perde uma boleia ou é apanhado de surpresa por um cancelamento. Para garantir a entrega fiável e evitar que as mensagens caiam no spam, a aplicação integra a API profissional do SendGrid.

## Catálogos de E-Mail
O sistema atualmente tem 5 tipos de e-mails configurados, que disparam automaticamente consoante as ações na plataforma.
1. **Verificação de Conta**: Quando um utilizador se regista na plataforma pela primeira vez. Apenas destinado aos novos utilizadores. O e-mail contém um Código OTP de Verificação único para validar a propriedade do endereço de e-mail.
2. **Notificação de Match**: Quando o algoritmo de Matchmaking deteta que uma nova oferta de viagem (PROVIDER) coincide com o pedido de um passageiro (NEEDRIDE), ou vice-versa. Apenas destinado ao passageiro (NEEDRIDE). O e-mail informa a origem, destino, data, o número de opções compatíveis e inclui um link direto para a viagem do condutor, facilitando a reserva rápida.
3. **Alerta de Novo Passageiro**: Quando um passageiro se junta a uma viagem. Apenas o condutor (PROVIDER) recebe o e-mail. O e-mail informa o condutor de que um colega (indicando o nome) acabou de reservar um lugar no seu carro, sugerindo a utilização do Chat da plataforma para combinar detalhes.
4. **Alerta de Cancelamento**: Quando um condutor elimina uma viagem que já tinha lugares reservados. O e-mail é enviado a todos os passageiros que estavam inscritos nessa viagem. O e-mail contém um aviso urgente de que a viagem para a qual estavam inscritos entre a origem X e o destino Y, foi cancelada pelo condutor, permitindo que os passageiros procurem uma alternativa.
5. **Solicitação de Viatura**: Quando um colaboorador utiliza o botão 'Solicitar Viatura' na plataforma. Destinado exclusivamente ao departamento de Serviços Partilhados (SP). O e-mail é formatado com os dados do pedido (colaborador, data, origem, destino e justificação) e configurado para que, ao clicarem em 'Enviar', a resposta siga diretamente para o e-mail do departamento dos Serviços Partilhados, facilitando a Gestão Logística fora da plataforma.

[Fluxo das Notificações por E-mail](fluxo-email.md)