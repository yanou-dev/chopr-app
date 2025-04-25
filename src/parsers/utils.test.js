import { identifyLogType } from "./utils";

const logExamples = {
  json: [
    '{"timestamp":"2023-06-15T14:23:10.123Z","level":"info","message":"User login successful","userId":"user123","ip":"192.168.1.1"}',
    '{"time":"2023-11-02T09:15:22.456Z","severity":"ERROR","requestId":"abcd1234","message":"Database connection failed","error":"Timeout"}',
    '{"@timestamp":"2024-02-12T18:05:33.789Z","log_level":"warn","trace_id":"xyz789","message":"Rate limit approaching","current":85,"limit":100}',
    '{"date":"2023-12-30T21:45:12Z","type":"audit","action":"file_delete","user":"admin","resource":"/data/reports/2023.pdf"}',
    '{"eventTime":"2024-01-18T03:12:45.123Z","eventType":"SYSTEM","status":"critical","component":"disk","message":"Low disk space"}',
  ],
  log4j: [
    "2023-05-12 15:23:45.123 INFO  [pool-2-thread-1] org.example.service.UserService - User authenticated successfully with token",
    "2023-08-17 09:32:18.456 ERROR [http-nio-8080-exec-5] org.example.controller.PaymentController - Failed to process payment: Invalid card number",
    "2024-01-30 22:15:02.789 WARN  [scheduler-5] org.example.batch.EmailJob - Retry attempt 3 of 5 for sending emails",
    "2023-12-05 14:28:37.321 DEBUG [app-initializer] org.example.config.DatabaseConfig - Connected to database v10.5.3 with 8 active connections",
    "2023-11-11 03:45:12.654 FATAL [main] org.example.Application - Application failed to start: No configuration file found at path /etc/app/config.yml",
  ],
  nodejs: [
    "2023-06-18T14:32:10.123Z info: Server started on port 3000",
    "2023-09-22T09:15:45.456Z error: Failed to connect to database after 5 retries",
    "2024-02-15T18:24:30.789Z warn: API rate limit exceeded for client 5f4dcc3b5aa765d61d8327deb882cf99",
    "[11:52:23] ERROR: Uncaught exception: Cannot read property 'userId' of undefined",
    "2023-12-10T22:05:37.321Z debug: OAuth tokens refreshed for 15 active users",
  ],
  logrus: [
    'time="2023-05-20T10:12:15Z" level=info msg="HTTP request completed" method=GET path="/api/users" status=200 duration=45.2ms',
    'time="2023-08-30T16:42:12Z" level=error msg="Failed to connect to Redis" attempt=3 error="connection refused" host="redis-primary:6379"',
    'time="2024-01-12T20:18:45Z" level=warn msg="Slow database query detected" query="SELECT * FROM users WHERE active=true" duration=1520ms',
    'time="2023-11-24T02:56:30Z" level=fatal msg="Application crashed" error="segmentation fault" goroutine=15',
    'time="2023-12-05T09:23:17Z" level=debug msg="Cache hit" key="user:prefs:1001" size=1.2kb age=45m',
  ],
  python: [
    "2023-05-12 10:15:30,123 INFO [MainThread] app.services.user: Successfully authenticated user john.doe@example.com",
    "2023-09-18 15:32:45,456 ERROR [Thread-5] app.database.connection: Database connection lost: Connection timed out after 30000ms",
    "2024-01-22 22:10:12,789 WARNING [AsyncioThread] app.api.client: Rate limit threshold reached (80%), throttling requests",
    "2023-11-14 03:27:05,321 CRITICAL [Watcher] app.monitor.disk: System disk usage above 95%, initiating emergency cleanup",
    'DEBUG:app.utils.cache:Cache miss for key "user:1001:settings", fetching from database',
  ],
  nginx: [
    '10.0.0.15 - john [12/May/2023:08:45:12 +0000] "GET /images/logo.png HTTP/1.1" 200 4523 "https://example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "2.5"',
    '192.168.1.54 - - [18/Aug/2023:14:32:10 +0000] "POST /api/v2/submit HTTP/1.1" 201 347 "https://forms.example.com/contact" "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1)" "-"',
    '2024/01/30 15:23:45 [error] 12345#0: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.100, server: example.com, request: "GET /api/status HTTP/1.1", upstream: "http://10.0.0.15:8080/status", host: "api.example.com"',
    '172.16.0.10 - alice [05/Dec/2023:18:15:34 +0000] "DELETE /api/comments/5678 HTTP/1.1" 204 0 "https://blog.example.com/posts/123" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "-"',
    '2023/11/11 02:45:12 [warn] 3456#0: *789 rate limit exceeded, client: 10.0.0.2, server: api.example.com, request: "GET /api/feed HTTP/1.1", host: "api.example.com"',
  ],
  iis: [
    "2023-05-12 08:32:15 192.168.112.123 GET /images/banner.jpg 80 - 10.0.0.8 Mozilla/5.0+(Windows+NT+10.0) 200 0 0 1243",
    "2023-08-17 15:42:30 10.0.0.45 POST /api/auth/login 443 john 192.168.1.10 Mozilla/5.0+(iPhone) 401 0 0 257",
    "2024-01-30 22:15:12 172.16.254.1 GET /reports/annual-2023.pdf 80 admin 10.0.0.12 Mozilla/5.0+(Macintosh) 200 0 0 5243890",
    "192.168.0.2, anonymous, 2023-12-05, 09:22:45, W3SVC1, WEBSERVER, 10.0.0.1, 80, 821, 4080, 200, 0, GET, /index.html, -",
    "2023-11-11 03:05:18 10.10.10.123 PUT /api/users/5678/profile 443 mary 192.168.1.15 PostmanRuntime/7.29.2 204 0 0 0",
  ],
  syslog: [
    'May 12 10:15:30 webserver01 nginx[12345]: 192.168.1.100 - - [12/May/2023:10:15:30 +0000] "GET /index.html HTTP/1.1" 200 4523',
    'Aug 17 15:42:30 dbserver02 postgresql[5678]: [3-1] 2023-08-17 15:42:30.123 UTC [5678] user@database ERROR: relation "users" does not exist at character 15',
    '<134>1 2024-01-30T22:15:12.123Z hostname appname 12345 ID47 [exampleSDID@32473 iut="3" eventSource="Application"] Application server restarted after routine maintenance',
    "Nov 11 03:05:18 firewall02 kernel: [12345.123456] iptables: IN=eth0 OUT= MAC=00:50:ba:85:85:ca SRC=192.168.1.100 DST=192.168.1.1 LEN=60 PROTO=TCP SPT=12345 DPT=22",
    "Dec 5 09:22:45 authserver01 sshd[5678]: Failed password for invalid user admin from 10.0.0.15 port 12345 ssh2",
  ],
  elasticsearch: [
    "[2023-05-12T10:15:30,123][INFO ][o.e.n.Node               ] [node-1] initialized",
    "[2023-08-17T15:42:30,456][WARN ][o.e.i.m.TimestampFieldMapper] [node-2] Using deprecated parameters [format] in field [timestamp] of type [date]",
    "[2024-01-30T22:15:12,789][ERROR][o.e.b.Bootstrap          ] [node-3] Exception during cluster bootstrap: java.lang.OutOfMemoryError: Java heap space",
    "[2023-12-05T09:22:45,321][INFO ][o.e.c.r.a.AllocationService] [node-1] Cluster health status changed from [YELLOW] to [GREEN]",
    "[2023-11-11T03:05:18,654][DEBUG][o.e.a.a.i.l.TransportGetAction] [node-2] [index/12345] Retrieving document",
  ],
  aws_cloudwatch: [
    '2023-05-12T10:15:30.123Z 1234abcd-12ab-34cd-56ef-1234567890ab INFO  [FunctionName] Starting execution with event {"source": "scheduler"}',
    "2023-08-17T15:42:30.456Z 5678efff-34cd-56ef-7890-abcdef123456 ERROR [LambdaFunction] Exception: Unable to connect to DynamoDB: Timeout",
    "2024-01-30T22:15:12.789Z 90abcdef-56ef-7890-abcd-ef1234567890 WARN  [ApiGateway] Throttling activated for endpoint /api/users - Current rate: 152 req/sec",
    "2023-12-05T09:22:45.321Z abcdef12-7890-abcd-ef12-34567890abcd INFO  [S3Trigger] Processing new file: reports/monthly/2023-12.pdf",
    "2023-11-11T03:05:18.654Z 567890ab-cdef-1234-5678-90abcdef1234 DEBUG [SQSProcessor] Message processed in 125ms with result: SUCCESS",
  ],
  kubernetes: [
    "2023-05-12T10:15:30.123Z INFO [controller] Successfully created pod: nginx-deployment-6d8f46c7d5-abcd1",
    '2023-08-17T15:42:30.456Z ERROR [kubelet] Failed to pull image "myregistry/myapp:latest": rpc error: code = Unknown desc = Error response from daemon: pull access denied',
    "2024-01-30T22:15:12.789Z WARN [kube-proxy] Received 15 pod CIDR updates, but only processed 12 in 5s",
    "E0605 09:22:45.321456    12345 kubelet.go:2170] Container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:Network plugin returns error: No IP addresses available in range set",
    "2023-11-11T03:05:18.654Z INFO [scheduler] Successfully assigned default/frontend-85b84d9c88-2x7zp to node-5",
  ],
  rails: [
    "I, [2023-05-12T10:15:30.123 #12345]  INFO -- : Processing by UsersController#show as HTML",
    "F, [2023-08-17T15:42:30.456 #67890] FATAL -- : Mysql2::Error: Access denied for user 'app'@'10.0.0.1' (using password: YES)",
    "E, [2024-01-30T22:15:12.789 #54321] ERROR -- : ActiveRecord::RecordNotFound: Couldn't find User with ID=123",
    "W, [2023-12-05T09:22:45.321 #34567]  WARN -- : ImageMagick not installed, falling back to default image processor",
    'D, [2023-11-11T03:05:18.654 #78901] DEBUG -- : User Load (1.2ms)  SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT $2',
  ],
  tomcat: [
    "15-May-2023 10:15:30.123 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 2345 ms",
    "17-Aug-2023 15:42:30.456 ERROR [http-nio-8080-exec-5] org.apache.catalina.core.StandardWrapperValve.invoke Servlet.service() for servlet [jsp] threw exception [java.lang.NullPointerException]",
    "30-Jan-2024 22:15:12.789 WARN [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployWAR Failed to process context [/myapp]",
    '05-Dec-2023 09:22:45.321 INFO [Thread-5] org.apache.coyote.AbstractProtocol.stop Stopping ProtocolHandler ["http-nio-8080"]',
    "11-Nov-2023 03:05:18.654 SEVERE [ajp-nio-8009-exec-3] org.apache.catalina.core.StandardContext.reload Error during context [/myapp] reload",
  ],
  clf: [
    '192.168.1.100 - john [12/May/2023:10:15:30 +0000] "GET /index.html HTTP/1.1" 200 4523',
    '10.0.0.45 - - [17/Aug/2023:15:42:30 +0000] "POST /api/login HTTP/1.1" 401 257',
    '172.16.254.1 - admin [30/Jan/2024:22:15:12 +0000] "GET /reports/monthly HTTP/1.1" 200 5324',
    '10.10.10.123 - - [05/Dec/2023:09:22:45 +0000] "GET /favicon.ico HTTP/1.1" 404 1125',
    '192.168.0.2 - mary [11/Nov/2023:03:05:18 +0000] "PUT /api/users/profile HTTP/1.1" 204 0',
  ],
};

describe("Log Format Detector", () => {
  for (const [format, examples] of Object.entries(logExamples)) {
    describe(`${format} format detection`, () => {
      examples.forEach((example, index) => {
        test(`should detect ${format} format example ${index + 1}`, () => {
          const result = identifyLogType(example);
          expect(result.success).toBe(true);
          expect(result.type).toBe(format);
        });
      });
    });
  }

  test("should return unknown for unrecognized format", () => {
    const result = identifyLogType("This is not a standard log format");
    expect(result.success).toBe(false);
    expect(result.type).toBe("unknown");
  });
});
