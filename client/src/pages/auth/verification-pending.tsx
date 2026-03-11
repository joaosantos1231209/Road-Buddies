import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resendVerification } from "@/lib/api";

export default function VerificationPending() {
  const [location, navigate] = useLocation();
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  
  // Get email from URL
  const email = new URLSearchParams(window.location.search).get("email");
  
  if (!email) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Erro</CardTitle>
            <CardDescription className="text-center">
              E-mail não fornecido. Por favor, tente se registrar novamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <p className="mt-4 text-center">Não foi possível identificar seu e-mail.</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              variant="default" 
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Voltar para o login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const handleResendVerification = async () => {
    try {
      setResending(true);
      await resendVerification(email);
      toast({
        title: "E-mail enviado!",
        description: "Um novo link de verificação foi enviado para seu e-mail.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao reenviar verificação:", error);
      toast({
        title: "Erro ao reenviar",
        description: "Não foi possível reenviar o e-mail de verificação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Verificação de E-mail Pendente</CardTitle>
          <CardDescription className="text-center">
            Por favor, verifique seu e-mail para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Mail className="h-16 w-16 text-primary" />
          <p className="mt-4 text-center">
            Enviamos um e-mail de verificação para <strong>{email}</strong>. 
            Por favor, verifique sua caixa de entrada e clique no link de verificação.
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Se você não recebeu o e-mail, verifique sua pasta de spam ou solicite um novo link de verificação.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            variant="outline" 
            onClick={handleResendVerification} 
            disabled={resending}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              "Reenviar e-mail de verificação"
            )}
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate("/login")}
            className="w-full"
          >
            Voltar para o login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}