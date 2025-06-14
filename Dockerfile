# Usa a imagem oficial do PostgreSQL
FROM postgres:latest

# Define o diretório de trabalho
WORKDIR /docker-entrypoint-initdb.d/

# Copia scripts SQL de inicialização (se houver)
#COPY init.sql /docker-entrypoint-initdb.d/

# Copia um arquivo de configuração customizado (se necessário)
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Define o ambiente do PostgreSQL
ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=password
ENV POSTGRES_DB=meu_banco

# Expõe a porta padrão do PostgreSQL
EXPOSE 5432
