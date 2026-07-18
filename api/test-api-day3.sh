BASE=http://localhost:4000/api

echo "--- Register regulator user ---"
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"regulator@test.com","password":"pass123","organizationId":"CarbonAuthority","fabricRole":"regulator"}'
echo

echo "--- Register company1 user ---"
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"company1@test.com","password":"pass123","organizationId":"company1","fabricRole":"company"}'
echo

echo "--- Login as regulator ---"
REG_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"regulator@test.com","password":"pass123"}' | jq -r '.token')
echo "Got token: ${REG_TOKEN:0:20}..."

echo "--- Issue CREDIT004 via API ---"
curl -s -X POST $BASE/credits/issue -H "Content-Type: application/json" -H "Authorization: Bearer $REG_TOKEN" \
  -d '{"creditId":"CREDIT004","owner":"company1","amount":60,"sourceProject":"Wind Farm API Test","issueDate":"2026-01-01","expiryDate":"2031-01-01","contentHash":"QmApiTest"}'
echo

echo "--- Verify CREDIT004 ---"
curl -s $BASE/credits/CREDIT004/verify -H "Authorization: Bearer $REG_TOKEN"
echo
