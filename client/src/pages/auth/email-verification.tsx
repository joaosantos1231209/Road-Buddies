import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { verifyEmail, resendVerification } from "@/lib/api";

export default function EmailVerification() {
  const [location, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  
  // Get token from URL
  const token = new URLSearchParams(window.location.search).get("token");
  const email = new URLSearchParams(window.location.search).get("email");
  
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await verifyEmail(token);
        setSuccess(true);
        toast({
          title: "E-mail verificado com sucesso!",
          description: "Agora você pode acessar todas as funcionalidades do aplicativo.",
          variant: "default",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        console.error("Erro ao verificar e-mail:", error);
        setSuccess(false);
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar seu e-mail. O link pode ter expirado.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    verifyToken();
  }, [token, navigate, toast]);
  
  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "E-mail não fornecido",
        description: "Não foi possível identificar seu e-mail para reenviar a verificação.",
        variant: "destructive",
      });
      return;
    }
    
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
          <CardTitle className="text-center text-2xl">Verificação de E-mail</CardTitle>
          <CardDescription className="text-center">
            {loading 
              ? "Verificando seu e-mail..." 
              : success === true 
                ? "Seu e-mail foi verificado com sucesso!" 
                : success === false 
                  ? "Houve um problema com a verificação do seu e-mail." 
                  : "Verifique seu e-mail para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p>Processando sua verificação...</p>
            </div>
          ) : success === true ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p>Verificação completa! Redirecionando para o login...</p>
            </div>
          ) : success === false ? (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p>Link de verificação inválido ou expirado.</p>
              {email && (
                <p className="text-sm text-gray-500 mt-2">
                  Você pode tentar reenviar o e-mail de verificação para {email}.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>
                Se você ainda não recebeu um e-mail de verificação, verifique sua pasta de spam ou solicite um novo link.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {success === false && email && (
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
          )}
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