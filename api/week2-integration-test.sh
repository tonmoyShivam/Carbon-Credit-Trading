BASE=http://localhost:4000/api

REG_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"regulator@test.com","password":"pass123"}' | jq -r '.token')

echo "--- Issue CREDIT006 ---"
curl -s -X POST $BASE/credits/issue -H "Content-Type: application/json" -H "Authorization: Bearer $REG_TOKEN" \
  -d '{"creditId":"CREDIT006","owner":"company1","amount":30,"sourceProject":"Week 2 Integration Test","issueDate":"2026-01-01","expiryDate":"2031-01-01","contentHash":"QmWeek2Final"}'
echo
sleep 3

echo "--- Fabric ledger state (source of truth) ---"
curl -s $BASE/credits/CREDIT006/verify -H "Authorization: Bearer $REG_TOKEN"
echo
